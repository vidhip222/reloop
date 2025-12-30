from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query

from ..deps import get_supabase
from ..supabase_client import SupabaseRestClient

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


def _safe_int(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


@router.get("/recovery")
async def recovery_dashboard(
    tenant_id: str = Query(...),
    client: SupabaseRestClient = Depends(get_supabase),
) -> Dict[str, Any]:
    returns_response = await client.get("returns", params={"tenant_id": f"eq.{tenant_id}"})
    if returns_response.status_code >= 400:
        raise HTTPException(status_code=returns_response.status_code, detail=returns_response.text)
    returns = returns_response.json()

    total = len(returns)
    processed = len([r for r in returns if r.get("status") == "processed"])
    flagged = len([r for r in returns if r.get("status") == "flagged"])
    listed = len([r for r in returns if r.get("status") in ("listed_ebay", "exported")])

    return {
        "total_returns": total,
        "processed": processed,
        "flagged": flagged,
        "listed": listed,
        "recovery_rate": round((processed + listed) / max(total, 1), 3),
    }


@router.get("/sustainability")
async def sustainability_dashboard(
    tenant_id: str = Query(...),
    client: SupabaseRestClient = Depends(get_supabase),
) -> Dict[str, Any]:
    metrics_response = await client.get("sustainability_metrics", params={"tenant_id": f"eq.{tenant_id}"})
    if metrics_response.status_code >= 400:
        raise HTTPException(status_code=metrics_response.status_code, detail=metrics_response.text)
    metrics = metrics_response.json()

    total_carbon = sum([float(m.get("carbon_kg") or 0) for m in metrics])
    total_waste = sum([float(m.get("waste_kg") or 0) for m in metrics])
    total_water = sum([float(m.get("water_liters") or 0) for m in metrics])
    avg_diversion = sum([float(m.get("diversion_rate") or 0) for m in metrics]) / max(len(metrics), 1)

    return {
        "carbon_kg": round(total_carbon, 3),
        "waste_kg": round(total_waste, 3),
        "water_liters": round(total_water, 3),
        "avg_diversion_rate": round(avg_diversion, 3),
    }


@router.get("/roi")
async def roi_dashboard(
    tenant_id: str = Query(...),
    client: SupabaseRestClient = Depends(get_supabase),
) -> Dict[str, Any]:
    resale_response = await client.get("resale_actions", params={"tenant_id": f"eq.{tenant_id}"})
    if resale_response.status_code >= 400:
        raise HTTPException(status_code=resale_response.status_code, detail=resale_response.text)
    resale = resale_response.json()

    total_actions = len(resale)
    success = len([r for r in resale if r.get("status") == "sold"])
    in_market = len([r for r in resale if r.get("status") in ("listed_ebay", "exported")])

    return {
        "total_resale_actions": total_actions,
        "sold": success,
        "in_market": in_market,
        "conversion_rate": round(success / max(total_actions, 1), 3),
        "last_refreshed": datetime.utcnow().isoformat() + "Z",
    }
