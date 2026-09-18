from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stt

app = FastAPI(title="EduMarket Zambia API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stt.router, prefix="/api", tags=["stt"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "edumarket-zambia"}
