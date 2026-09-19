import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.stt.factory import get_stt_provider

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_AUDIO_BYTES = 10 * 1024 * 1024  # 10 MB


class STTResponse(BaseModel):
    text: str
    provider: str
    status: str


@router.post("/stt", response_model=STTResponse)
async def speech_to_text(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="Please upload an audio file.")

    audio_bytes = await file.read()

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file.")

    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Audio clip is too large. Keep recordings under 10 MB.",
        )

    provider = get_stt_provider()
    try:
        text = await provider.transcribe(
            audio_bytes, filename=file.filename or "audio.webm"
        )
    except Exception as exc:
        logger.exception("STT transcription failed")
        raise HTTPException(
            status_code=500,
            detail="We couldn't transcribe that audio. Please try again.",
        ) from exc

    return STTResponse(
        text=text,
        provider=type(provider).__name__,
        status="success",
    )