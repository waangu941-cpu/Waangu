from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.stt.factory import get_stt_provider

router = APIRouter()


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
    provider = get_stt_provider()
    try:
        text = await provider.transcribe(
            audio_bytes, filename=file.filename or "audio.webm"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    return STTResponse(text=text, provider=type(provider).__name__, status="success")
