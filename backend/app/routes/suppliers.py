from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_supabase
from ..models import SupplierMetricRequest
from ..supabase_client import SupabaseRestClient

router = APIRouter(prefix="/supplier", tags=["supplier"])


@router.get("/metrics")
async def get_supplier_metrics(tenant_id: str, client: SupabaseRestClient = Depends(get_supabase)) -> dict:
    response = await client.get("supplier_metrics", params={"tenant_id": f"eq.{tenant_id}"})
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return {"metrics": response.json()}


@router.post("/metrics")
async def create_supplier_metric(
    request: SupplierMetricRequest, client: SupabaseRestClient = Depends(get_supabase)
) -> dict:
    response = await client.post("supplier_metrics", json=request.model_dump())
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return {"metric": response.json()[0]}


@router.post("/{supplier_id}/flag")
async def flag_supplier(
    supplier_id: str, flagged: bool, client: SupabaseRestClient = Depends(get_supabase)
) -> dict:
    response = await client.patch("suppliers", json={"flagged": flagged}, params={"id": f"eq.{supplier_id}"})
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return {"status": "ok"}
