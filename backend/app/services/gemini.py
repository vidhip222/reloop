from __future__ import annotations

import json
from typing import Any, Dict

import google.generativeai as genai

from ..config import settings


def _safe_parse_json(text: str) -> Dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json", "", 1).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid JSON response from Gemini.") from exc


class GeminiService:
    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required.")
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    def classify_return(self, image_url: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""
You are an AI return classifier. Use the provided metadata and image URL to recommend a single action.
Return JSON only. Schema:
{{
  "tag": "Relist|Donate|Recycle|Refund|Outlet|Resale|Review",
  "rationale": "short explanation",
  "confidence": 0.0,
  "resale_channel": "eBay|ThredUp|Depop|Poshmark|null",
  "suggested_price": 0.0,
  "notes": "optional"
}}

Image URL: {image_url}
Metadata: {json.dumps(metadata)}
"""
        result = self.model.generate_content(prompt)
        return _safe_parse_json(result.text)
