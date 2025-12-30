from __future__ import annotations

import base64
from typing import Any, Dict

import httpx

from ..config import settings


class EbayService:
    def __init__(self) -> None:
        if not settings.ebay_client_id or not settings.ebay_client_secret:
            raise RuntimeError("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are required.")
        self.client_id = settings.ebay_client_id
        self.client_secret = settings.ebay_client_secret
        self.access_token: str | None = None

    async def authenticate(self) -> str:
        credentials = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode("utf-8")).decode("utf-8")
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                "https://api.ebay.com/identity/v1/oauth2/token",
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data="grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
            )
        response.raise_for_status()
        data = response.json()
        self.access_token = data.get("access_token")
        return self.access_token or ""

    async def create_listing(self, item: Dict[str, Any]) -> Dict[str, Any]:
        if not self.access_token:
            await self.authenticate()

        xml_body = self._build_xml_request(item)
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.ebay.com/ws/api.dll",
                headers={
                    "X-EBAY-API-SITEID": "0",
                    "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
                    "X-EBAY-API-CALL-NAME": "AddFixedPriceItem",
                    "X-EBAY-API-IAF-TOKEN": self.access_token or "",
                    "Content-Type": "text/xml",
                },
                content=xml_body,
            )
        response.raise_for_status()
        xml = response.text
        success = "<Ack>Success</Ack>" in xml
        item_id = None
        if "<ItemID>" in xml:
            item_id = xml.split("<ItemID>")[1].split("</ItemID>")[0]
        return {"success": success, "item_id": item_id, "raw": xml}

    def _build_xml_request(self, item: Dict[str, Any]) -> str:
        picture_urls = "".join([f"<PictureURL>{url}</PictureURL>" for url in item.get("images", [])])
        condition_id = self._get_condition_id(item.get("condition", "Good"))
        return f"""<?xml version="1.0" encoding="utf-8"?>
<AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>{self.access_token}</eBayAuthToken>
  </RequesterCredentials>
  <Item>
    <Title>{item.get("title")}</Title>
    <Description>{item.get("description")}</Description>
    <StartPrice currencyID="USD">{item.get("price")}</StartPrice>
    <CategoryID>{item.get("category")}</CategoryID>
    <PictureDetails>
      {picture_urls}
    </PictureDetails>
    <ConditionID>{condition_id}</ConditionID>
    <ListingDuration>Days_7</ListingDuration>
    <ListingType>FixedPriceItem</ListingType>
    <Currency>USD</Currency>
  </Item>
</AddFixedPriceItemRequest>"""

    def _get_condition_id(self, condition: str) -> str:
        mapping = {
            "New": "1000",
            "Like New": "1500",
            "Excellent": "2000",
            "Very Good": "2500",
            "Good": "3000",
            "Acceptable": "4000",
        }
        return mapping.get(condition, "3000")
