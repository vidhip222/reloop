from fastapi import FastAPI

from .config import settings
from .routes import dashboards, forecasts, health, returns, suppliers


def create_app() -> FastAPI:
    settings.validate()
    app = FastAPI(title="ReLoop API", version="0.1.0")
    app.include_router(health.router)
    app.include_router(returns.router)
    app.include_router(dashboards.router)
    app.include_router(suppliers.router)
    app.include_router(forecasts.router)
    return app


app = create_app()
