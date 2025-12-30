from __future__ import annotations

import csv
import io
import json
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse

from ..deps import get_supabase
from ..models import (
    ListingRequest,
    OverrideRequest,
    RefundRequest,
    ReturnClassifyResponse,
    ReturnIntakeRequest,
    ReturnIntakeResponse,
    RouteRequest,
)
from ..services.bias import compute_parity
from ..services.csv_export import generate_csv
from ..services.ebay import EbayService
from ..services.gemini import GeminiService
from ..services.stripe import StripeService
from ..supabase_client import SupabaseRestClient

router = APIRouter(prefix="/returns", tags=["returns"])


async def _insert_audit(
    client: SupabaseRestClient, tenant_id: str, action: str, entity_type: str, entity_id: str | None, payload: Dict[str, Any]
) -> None:
    await client.post(
        "audit_log",
        json={
            "tenant_id": tenant_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "payload": payload,
        },
    )


@router.post("/intake", response_model=ReturnIntakeResponse)
async def intake_return(request: ReturnIntakeRequest, client: SupabaseRestClient = Depends(get_supabase)) -> ReturnIntakeResponse:
    payload = request.model_dump()
    payload["status"] = "pending"
    response = await client.post("returns", json=payload)
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    row = response.json()[0]
    await _insert_audit(client, request.tenant_id, "return_intake", "returns", row["id"], payload)
    return ReturnIntakeResponse(return_id=row["id"], status=row["status"])


@router.post("/bulk-intake")
async def bulk_intake(
    tenant_id: str = Form(...),
    file: UploadFile = File(...),
    client: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    batch_response = await client.post(
        "return_batches",
        json={"tenant_id": tenant_id, "file_name": file.filename or "bulk.csv", "status": "processing"},
    )
    if batch_response.status_code >= 400:
        raise HTTPException(status_code=batch_response.status_code, detail=batch_response.text)
    batch = batch_response.json()[0]

    rows: List[Dict[str, Any]] = []
    for row in reader:
        metadata = {}
        if row.get("metadata"):
            try:
                metadata = json.loads(row["metadata"])
            except json.JSONDecodeError:
                metadata = {"raw": row["metadata"]}
        rows.append(
            {
                "tenant_id": tenant_id,
                "sku": row.get("sku"),
                "return_reason": row.get("return_reason"),
                "image_url": row.get("image_url"),
                "brand": row.get("brand"),
                "category": row.get("category"),
                "condition": row.get("condition"),
                "price_suggested": float(row["price_suggested"]) if row.get("price_suggested") else None,
                "currency": row.get("currency") or "USD",
                "metadata": metadata,
                "status": "pending",
                "batch_id": batch["id"],
            }
        )

    if rows:
        insert_response = await client.post("returns", json=rows)
        if insert_response.status_code >= 400:
            raise HTTPException(status_code=insert_response.status_code, detail=insert_response.text)

    await client.patch(
        "return_batches",
        json={"status": "completed"},
        params={"id": f"eq.{batch['id']}"},
    )
    await _insert_audit(client, tenant_id, "bulk_intake", "return_batches", batch["id"], {"count": len(rows)})
    return {"batch_id": batch["id"], "count": len(rows)}


@router.post("/{return_id}/classify", response_model=ReturnClassifyResponse)
async def classify_return(
    return_id: str,
    client: SupabaseRestClient = Depends(get_supabase),
) -> ReturnClassifyResponse:
    response = await client.get("returns", params={"id": f"eq.{return_id}"})
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    rows = response.json()
    if not rows:
        raise HTTPException(status_code=404, detail="Return not found.")
    record = rows[0]

    gemini = GeminiService()
    classification = gemini.classify_return(record.get("image_url") or "", record.get("metadata") or {})
    decision_payload = {
        "return_id": return_id,
        "tenant_id": record["tenant_id"],
        "tag": classification["tag"],
        "rationale": classification["rationale"],
        "confidence": classification["confidence"],
        "resale_channel": classification.get("resale_channel"),
        "suggested_price": classification.get("suggested_price"),
        "notes": classification.get("notes"),
    }

    # Basic parity stats for transparency
    decisions_response = await client.get("ai_decisions", params={"tenant_id": f"eq.{record['tenant_id']}", "limit": "200"})
    decisions = decisions_response.json() if decisions_response.status_code < 400 else []
    decisions.append({"tag": classification["tag"], "brand": record.get("brand"), "category": record.get("category")})
    fairness = {
        "brand": compute_parity(decisions, "brand"),
        "category": compute_parity(decisions, "category"),
    }
    decision_payload["fairness_checks"] = fairness

    decision_response = await client.post("ai_decisions", json=decision_payload)
    if decision_response.status_code >= 400:
        raise HTTPException(status_code=decision_response.status_code, detail=decision_response.text)

    update_response = await client.patch(
        "returns",
        json={
            "ai_action": classification["tag"],
            "ai_confidence": classification["confidence"],
            "ai_reasoning": classification["rationale"],
            "routed_channel": classification.get("resale_channel"),
            "status": "processed" if classification["tag"] != "Review" else "flagged",
        },
        params={"id": f"eq.{return_id}"},
    )
    if update_response.status_code >= 400:
        raise HTTPException(status_code=update_response.status_code, detail=update_response.text)

    await _insert_audit(client, record["tenant_id"], "ai_classify", "returns", return_id, decision_payload)
    return ReturnClassifyResponse(**classification)


@router.post("/{return_id}/override")
async def override_return(
    return_id: str,
    request: OverrideRequest,
    client: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    response = await client.get("returns", params={"id": f"eq.{return_id}"})
    rows = response.json() if response.status_code < 400 else []
    if not rows:
        raise HTTPException(status_code=404, detail="Return not found.")
    record = rows[0]
    metadata = record.get("metadata") or {}
    metadata["manual_override_reason"] = request.reason

    update_response = await client.patch(
        "returns",
        json={"manual_override": request.manual_override, "metadata": metadata, "status": "flagged"},
        params={"id": f"eq.{return_id}"},
    )
    if update_response.status_code >= 400:
        raise HTTPException(status_code=update_response.status_code, detail=update_response.text)

    await _insert_audit(client, record["tenant_id"], "manual_override", "returns", return_id, request.model_dump())
    return {"status": "ok"}


@router.post("/{return_id}/route")
async def route_return(
    return_id: str,
    request: RouteRequest,
    client: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    response = await client.get("returns", params={"id": f"eq.{return_id}"})
    rows = response.json() if response.status_code < 400 else []
    if not rows:
        raise HTTPException(status_code=404, detail="Return not found.")
    record = rows[0]

    action_response = await client.post(
        "resale_actions",
        json={
            "return_id": return_id,
            "tenant_id": record["tenant_id"],
            "channel": request.channel,
            "status": "pending",
            "payload": {"mission_config": request.mission_config},
        },
    )
    if action_response.status_code >= 400:
        raise HTTPException(status_code=action_response.status_code, detail=action_response.text)

    await client.patch("returns", json={"routed_channel": request.channel}, params={"id": f"eq.{return_id}"})
    await _insert_audit(client, record["tenant_id"], "route_return", "returns", return_id, request.model_dump())
    return {"status": "ok"}


@router.post("/{return_id}/list/ebay")
async def list_on_ebay(
    return_id: str,
    request: ListingRequest,
    client: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    response = await client.get("returns", params={"id": f"eq.{return_id}"})
    rows = response.json() if response.status_code < 400 else []
    if not rows:
        raise HTTPException(status_code=404, detail="Return not found.")
    record = rows[0]

    ebay = EbayService()
    listing = await ebay.create_listing(request.model_dump())
    status = "listed_ebay" if listing.get("success") else "listing_failed"

    await client.post(
        "resale_actions",
        json={
            "return_id": return_id,
            "tenant_id": record["tenant_id"],
            "channel": "eBay",
            "external_listing_id": listing.get("item_id"),
            "status": status,
            "payload": {"request": request.model_dump(), "response": listing},
        },
    )
    await client.patch("returns", json={"status": status}, params={"id": f"eq.{return_id}"})
    await _insert_audit(client, record["tenant_id"], "list_ebay", "returns", return_id, listing)
    return {"status": status, "listing": listing}


@router.post("/{return_id}/export/thredup")
async def export_thredup(return_id: str, client: SupabaseRestClient = Depends(get_supabase)) -> PlainTextResponse:
    response = await client.get("returns", params={"id": f"eq.{return_id}"})
    rows = response.json() if response.status_code < 400 else []
    if not rows:
        raise HTTPException(status_code=404, detail="Return not found.")
    record = rows[0]
    csv_content = generate_csv([record])
    await _insert_audit(client, record["tenant_id"], "export_thredup", "returns", return_id, {"exported": True})
    return PlainTextResponse(
        csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="thredup_return_{return_id}.csv"'},
    )


@router.post("/{return_id}/refund")
async def refund_return(
    return_id: str,
    request: RefundRequest,
    client: SupabaseRestClient = Depends(get_supabase),
) -> dict:
    response = await client.get("returns", params={"id": f"eq.{return_id}"})
    rows = response.json() if response.status_code < 400 else []
    if not rows:
        raise HTTPException(status_code=404, detail="Return not found.")
    record = rows[0]

    stripe_service = StripeService()
    refund = stripe_service.create_refund(
        payment_intent_id=request.payment_intent_id,
        amount=request.amount,
        currency=request.currency,
        idempotency_key=request.idempotency_key,
    )
    await client.post(
        "refund_actions",
        json={
            "return_id": return_id,
            "tenant_id": record["tenant_id"],
            "stripe_refund_id": refund.get("id"),
            "status": refund.get("status"),
            "amount": request.amount,
            "currency": request.currency,
            "idempotency_key": request.idempotency_key,
        },
    )
    await client.patch("returns", json={"status": "refunded"}, params={"id": f"eq.{return_id}"})
    await _insert_audit(client, record["tenant_id"], "refund", "returns", return_id, {"refund_id": refund.get("id")})
    return {"status": refund.get("status"), "refund_id": refund.get("id")}
