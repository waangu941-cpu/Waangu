import os

from .base import SpeechToTextProvider
from .stub_provider import StubSTTProvider


def get_stt_provider() -> SpeechToTextProvider:
    provider = os.getenv("STT_PROVIDER", "stub").lower()
    if provider in ("faster-whisper", "whisper"):
        try:
            from .whisper_provider import WhisperSTTProvider
            return WhisperSTTProvider()
        except ImportError:
            return StubSTTProvider()
    return StubSTTProvider()
