from __future__ import annotations

from typing import Any, Dict, Optional

import httpx

from .config import settings


class SupabaseRestClient:
    def __init__(self, access_token: str) -> None:
        self.base_url = f"{settings.supabase_url}/rest/v1"
        self.headers = {
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Any] = None,
    ) -> httpx.Response:
        url = f"{self.base_url}/{path.lstrip('/')}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(method, url, headers=self.headers, params=params, json=json)
        return response

    async def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> httpx.Response:
        return await self.request("GET", path, params=params)

    async def post(self, path: str, json: Any) -> httpx.Response:
        return await self.request("POST", path, json=json)

    async def patch(self, path: str, json: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> httpx.Response:
        return await self.request("PATCH", path, params=params, json=json)

    async def delete(self, path: str, params: Optional[Dict[str, Any]] = None) -> httpx.Response:
        return await self.request("DELETE", path, params=params)


def get_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        return ""
    if authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return ""
