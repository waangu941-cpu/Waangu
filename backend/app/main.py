import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from app.routers import stt  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

ENV = os.getenv("APP_ENV", "development").lower()
IS_PROD = ENV == "production"

# Comma-separated list of allowed origins, e.g.:
#   ALLOWED_ORIGINS="https://edumarket-zambia.vercel.app,https://edumarket.co.zm"
# Hardcoding prod URLs in source means every new deploy preview or domain
# change requires a code change + redeploy; env vars let staging/prod diverge
# without touching the codebase, and let you rotate a compromised origin fast.
_default_dev_origins = "http://localhost:5173,http://127.0.0.1:5173"
_default_prod_origins = "https://edumarket-zambiaedumarket-zambia-ap.vercel.app"
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS", _default_prod_origins if IS_PROD else _default_dev_origins
)
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

if IS_PROD and not allowed_origins:
    # Fail loud rather than silently allowing no origins (breaks the frontend)
    # or, worse, someone "fixing" it later with allow_origins=["*"].
    raise RuntimeError(
        "ALLOWED_ORIGINS must be set in production (comma-separated origin list)."
    )

for origin in allowed_origins:
    if origin == "*":
        raise RuntimeError(
            "Wildcard '*' in ALLOWED_ORIGINS is incompatible with "
            "allow_credentials=True and will be rejected by browsers anyway."
        )
    logger.info("CORS: allowing origin %s", origin)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload the STT model so the first real request isn't slow.
    try:
        from app.services.stt.factory import get_stt_provider

        provider = get_stt_provider()
        await provider.warm_up()
        logger.info("STT provider warmed up.")
    except Exception as exc:  # noqa: BLE001
        logger.warning("STT warm-up skipped: %s", exc)
    yield


app = FastAPI(
    title="EduMarket Zambia API",
    lifespan=lifespan,
    # Don't expose interactive API docs / schema in production.
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    # Scope methods/headers to what the app actually needs instead of "*".
    # Wildcard methods/headers is harmless *by itself*, but it's the kind of
    # default that quietly becomes a problem the day someone adds a cookie-
    # based session and forgets to revisit this file.
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(stt.router, prefix="/api", tags=["stt"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "edumarket-zambia", "env": ENV}