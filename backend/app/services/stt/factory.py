import logging
import os

from .base import SpeechToTextProvider
from .stub_provider import StubSTTProvider

logger = logging.getLogger(__name__)

_provider_cache: SpeechToTextProvider | None = None


def get_stt_provider() -> SpeechToTextProvider:
    """
    Returns a cached STT provider. The implementation is chosen by the
    STT_PROVIDER environment variable:

        stub            — placeholder text, no model needed (default)
        faster-whisper  — real transcription via faster-whisper
    """
    global _provider_cache
    if _provider_cache is not None:
        return _provider_cache

    requested = os.getenv("STT_PROVIDER", "stub").lower().strip()

    if requested in ("faster-whisper", "whisper"):
        try:
            from .whisper_provider import WhisperSTTProvider

            _provider_cache = WhisperSTTProvider()
            logger.info("STT provider: WhisperSTTProvider")
            return _provider_cache
        except ImportError as exc:
            logger.warning(
                "faster-whisper requested but not installed (%s). "
                "Falling back to stub.",
                exc,
            )

    _provider_cache = StubSTTProvider()
    logger.info("STT provider: StubSTTProvider (requested=%s)", requested)
    return _provider_cache