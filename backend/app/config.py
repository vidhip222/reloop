import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")


class Settings:
    def __init__(self) -> None:
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY", "")
        self.supabase_storage_bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "return-images")

        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")

        self.stripe_secret_key = os.getenv("STRIPE_SECRET_KEY", "")

        self.ebay_client_id = os.getenv("EBAY_CLIENT_ID", "")
        self.ebay_client_secret = os.getenv("EBAY_CLIENT_SECRET", "")
        self.ebay_environment = os.getenv("EBAY_ENVIRONMENT", "production")

        self.app_env = os.getenv("APP_ENV", "development")

    def validate(self) -> None:
        if self.app_env == "test":
            return
        if not self.supabase_url or not self.supabase_anon_key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY are required.")


settings = Settings()
