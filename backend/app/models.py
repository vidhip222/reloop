from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ReturnIntakeRequest(BaseModel):
    tenant_id: str
    sku: str
    return_reason: str
    image_url: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    price_suggested: Optional[float] = None
    currency: str = "USD"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ReturnIntakeResponse(BaseModel):
    return_id: str
    status: str


class ReturnClassifyResponse(BaseModel):
    tag: str
    rationale: str
    confidence: float
    resale_channel: Optional[str] = None
    suggested_price: Optional[float] = None
    notes: Optional[str] = None


class OverrideRequest(BaseModel):
    manual_override: str
    reason: str


class RouteRequest(BaseModel):
    channel: str
    mission_config: Dict[str, Any] = Field(default_factory=dict)


class ListingRequest(BaseModel):
    title: str
    description: str
    price: float
    category: str
    images: List[str]
    condition: str


class RefundRequest(BaseModel):
    amount: float
    currency: str = "USD"
    payment_intent_id: str
    reason: Optional[str] = None
    idempotency_key: Optional[str] = None


class SupplierMetricRequest(BaseModel):
    tenant_id: str
    supplier_id: str
    return_rate: Optional[float] = None
    defect_proxy: Optional[float] = None
    sla_proxy: Optional[float] = None
    reliability_score: Optional[float] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None


class ForecastRequest(BaseModel):
    tenant_id: str
    sku: str
    predicted_quantity: int
    confidence: Optional[float] = None
    trend_analysis: Optional[str] = None
    inputs: Dict[str, Any] = Field(default_factory=dict)


class SustainabilityMetricRequest(BaseModel):
    tenant_id: str
    return_id: Optional[str] = None
    diversion_rate: Optional[float] = None
    carbon_kg: Optional[float] = None
    waste_kg: Optional[float] = None
    water_liters: Optional[float] = None
