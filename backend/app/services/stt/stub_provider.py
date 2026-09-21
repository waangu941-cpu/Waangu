import logging

from .base import SpeechToTextProvider

logger = logging.getLogger(__name__)


class StubSTTProvider(SpeechToTextProvider):
    """Fallback provider used when faster-whisper isn't installed or configured.

    Exists so the app still boots and the /api/stt endpoint still responds
    (useful for frontend development without pulling in the whisper model),
    but it does NOT transcribe anything — callers must not mistake its output
    for real text.
    """

    def __init__(self) -> None:
        # A misconfigured deployment silently falling back to the stub is an
        # easy thing to miss (endpoint still returns 200s, just with fake
        # text) — log it loudly once at construction time rather than only
        # on first request.
        logger.warning(
            "StubSTTProvider is active — audio will NOT be transcribed. "
            "This should never be used in production."
        )

    async def warm_up(self) -> None:
        """No model to preload; present for interface parity with real providers."""
        return None

    async def transcribe(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        if not audio_bytes:
            return ""
        size_kb = max(1, len(audio_bytes) // 1024)
        return (
            f"[STT stub] Received {size_kb} KB audio ({filename}). "
            "Real transcription is not enabled on this deployment."
        )