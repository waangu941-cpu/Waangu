import asyncio
import logging
import os

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.stt.base import TranscriptionError
from app.services.stt.factory import get_stt_provider

logger = logging.getLogger(__name__)

router = APIRouter()

# Kept configurable (and intentionally the authoritative limit — this check
# runs before any audio touches a provider) rather than hardcoded, so it can
# be tuned per-deployment without a code change.
MAX_AUDIO_BYTES = int(os.getenv("STT_MAX_AUDIO_BYTES", str(10 * 1024 * 1024)))  # 10 MB
_READ_CHUNK_SIZE = 1024 * 1024  # 1 MB

# Upper bound on how long a single transcription may take. Protects against
# a stuck/hung provider call holding the (limited, semaphore-guarded) whisper
# worker slot forever and starving every other request behind it.
TRANSCRIBE_TIMEOUT_S = float(os.getenv("STT_TIMEOUT_SECONDS", "30"))

_ALLOWED_CONTENT_TYPE_PREFIXES = ("audio/",)
# Some browsers/JS clients send a generic type for Blob uploads instead of a
# proper audio/* mime type — allow it rather than reject valid recordings.
_ALLOWED_CONTENT_TYPES = {"application/octet-stream"}


class STTResponse(BaseModel):
    text: str
    provider: str
    status: str


@router.post("/stt", response_model=STTResponse)
async def speech_to_text(file: UploadFile = File(...)):
    # Note: FastAPI's `File(...)` already makes this required and returns a
    # 422 automatically if it's missing — an UploadFile instance is also
    # always truthy, so `if not file` never actually fires. Validate content
    # instead of presence.
    content_type = (file.content_type or "").lower()
    if content_type and not (
        content_type.startswith(_ALLOWED_CONTENT_TYPE_PREFIXES)
        or content_type in _ALLOWED_CONTENT_TYPES
    ):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported content type: {content_type}. Please upload an audio file.",
        )

    audio_bytes = await _read_with_limit(file, MAX_AUDIO_BYTES)

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file.")

    provider = get_stt_provider()
    try:
        text = await asyncio.wait_for(
            provider.transcribe(audio_bytes, filename=file.filename or "audio.webm"),
            timeout=TRANSCRIBE_TIMEOUT_S,
        )
    except TranscriptionError as exc:
        # Bad/corrupt/oversized audio — the client's fault, not the server's.
        logger.warning("STT transcription rejected: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except asyncio.TimeoutError as exc:
        logger.error("STT transcription timed out after %.0fs", TRANSCRIBE_TIMEOUT_S)
        raise HTTPException(
            status_code=504, detail="Transcription took too long. Please try a shorter clip."
        ) from exc
    except Exception as exc:  # noqa: BLE001 — genuinely unexpected, not the caller's fault
        logger.exception("STT transcription failed")
        raise HTTPException(
            status_code=500,
            detail="We couldn't transcribe that audio. Please try again.",
        ) from exc

    return STTResponse(text=text, provider=provider.name, status="success")


async def _read_with_limit(file: UploadFile, max_bytes: int) -> bytes:
    """Read an UploadFile in chunks, aborting as soon as the size limit is
    exceeded rather than buffering the whole body first.

    `await file.read()` with no check until afterward means a client can
    make the server allocate memory for an arbitrarily large upload before
    you ever get to reject it — a single oversized (or malicious) request
    could exhaust memory on a small instance. Reading incrementally caps
    that at max_bytes + one chunk, worst case.
    """
    chunks = bytearray()
    while True:
        chunk = await file.read(_READ_CHUNK_SIZE)
        if not chunk:
            break
        chunks.extend(chunk)
        if len(chunks) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"Audio clip is too large. Keep recordings under {max_bytes // (1024 * 1024)} MB.",
            )
    return bytes(chunks)