import logging
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


app = FastAPI(title="EduMarket Zambia API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # Add your Vercel URL here once you have it, e.g.:
        # "https://edumarket-zambia.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stt.router, prefix="/api", tags=["stt"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "edumarket-zambia"}