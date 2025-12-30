from __future__ import annotations

from fastapi import Depends, Header, HTTPException

from .supabase_client import SupabaseRestClient, get_bearer_token


async def get_supabase(authorization: str | None = Header(default=None)) -> SupabaseRestClient:
    token = get_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token.")
    return SupabaseRestClient(token)
