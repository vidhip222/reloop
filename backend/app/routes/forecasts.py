from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_supabase
from ..models import ForecastRequest
from ..supabase_client import SupabaseRestClient

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("/")
async def get_forecasts(tenant_id: str, client: SupabaseRestClient = Depends(get_supabase)) -> dict:
    response = await client.get("forecasts", params={"tenant_id": f"eq.{tenant_id}"})
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return {"forecasts": response.json()}


@router.post("/")
async def create_forecast(request: ForecastRequest, client: SupabaseRestClient = Depends(get_supabase)) -> dict:
    response = await client.post("forecasts", json=request.model_dump())
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)
    return {"forecast": response.json()[0]}
