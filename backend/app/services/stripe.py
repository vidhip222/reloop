from __future__ import annotations

import stripe

from ..config import settings


class StripeService:
    def __init__(self) -> None:
        if not settings.stripe_secret_key:
            raise RuntimeError("STRIPE_SECRET_KEY is required.")
        stripe.api_key = settings.stripe_secret_key

    def create_refund(self, payment_intent_id: str, amount: float, currency: str, idempotency_key: str | None) -> dict:
        params = {
            "payment_intent": payment_intent_id,
            "amount": int(amount * 100),
            "currency": currency.lower(),
        }
        return stripe.Refund.create(**params, idempotency_key=idempotency_key)
