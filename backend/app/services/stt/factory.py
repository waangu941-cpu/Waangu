import logging
import os
import threading

from .base import SpeechToTextProvider
from .stub_provider import StubSTTProvider

logger = logging.getLogger(__name__)

_KNOWN_PROVIDERS = ("stub", "faster-whisper", "whisper")

_provider_cache: SpeechToTextProvider | None = None
_cache_lock = threading.Lock()


def get_stt_provider() -> SpeechToTextProvider:
    """
    Returns a cached STT provider. The implementation is chosen by the
    STT_PROVIDER environment variable:

        stub            — placeholder text, no model needed (default)
        faster-whisper  — real transcription via faster-whisper

    Cached after first call — call reset_stt_provider_cache() in tests that
    need a fresh instance (e.g. after monkeypatching STT_PROVIDER).
    """
    global _provider_cache

    # Cheap fast path: avoid taking the lock on every request once warm.
    if _provider_cache is not None:
        return _provider_cache

    with _cache_lock:
        # Re-check inside the lock — another thread/request may have set it
        # while we were waiting (get_stt_provider can be called concurrently
        # from the lifespan warm-up and the first incoming request).
        if _provider_cache is not None:
            return _provider_cache

        requested = os.getenv("STT_PROVIDER", "stub").lower().strip()
        if requested not in _KNOWN_PROVIDERS:
            logger.warning(
                "Unrecognized STT_PROVIDER=%r (expected one of %s). Falling back to stub.",
                requested,
                _KNOWN_PROVIDERS,
            )

        if requested in ("faster-whisper", "whisper"):
            _provider_cache = _build_whisper_provider()
            if _provider_cache is not None:
                return _provider_cache
            # _build_whisper_provider already logged the reason; fall through to stub.

        _provider_cache = StubSTTProvider()
        logger.info("STT provider: StubSTTProvider (requested=%s)", requested)
        return _provider_cache


def _build_whisper_provider() -> SpeechToTextProvider | None:
    """Attempt to construct WhisperSTTProvider, returning None on failure.

    faster-whisper is imported *inside* WhisperSTTProvider lazily (on first
    real use), not at construction time — so simply instantiating
    WhisperSTTProvider here would never raise ImportError even if the
    package is missing, and the "fall back to stub" behavior would silently
    fail to trigger. Import it here, up front, so an unavailable dependency
    is caught immediately at startup instead of surfacing later as a 500 on
    someone's first transcription request.
    """
    try:
        import faster_whisper  # noqa: F401
    except ImportError as exc:
        logger.warning(
            "faster-whisper requested but not installed (%s). Falling back to stub.",
            exc,
        )
        return None

    from .whisper_provider import WhisperSTTProvider

    try:
        provider = WhisperSTTProvider()
    except Exception as exc:  # noqa: BLE001 — any construction-time failure
        logger.warning("Failed to construct WhisperSTTProvider (%s). Falling back to stub.", exc)
        return None

    logger.info("STT provider: WhisperSTTProvider")
    return provider


def reset_stt_provider_cache() -> None:
    """Clear the cached provider. Intended for tests only."""
    global _provider_cache
    with _cache_lock:
        _provider_cache = None