import asyncio
import logging
import os
import tempfile
import threading
from pathlib import Path

from .base import SpeechToTextProvider

logger = logging.getLogger(__name__)


# STEM vocabulary prompt — nudges the model toward technical terms.
STEM_PROMPT = (
    "H2O, CO2, CH3COOH, C2H5OH, mitochondria, photosynthesis, chloroplast, "
    "Pythagorean theorem, quadratic formula, a squared plus b squared equals c squared, "
    "x equals negative b plus or minus the square root of b squared minus 4ac over 2a, "
    "chemical formula, biology, physics, mathematics, STEM, "
    "Zambian English, teacher, student, lesson."
)


def _env_str(key: str, default: str) -> str:
    return os.getenv(key, default).strip() or default


def _env_int(key: str, default: int) -> int:
    try:
        return int(os.getenv(key, str(default)))
    except ValueError:
        return default


class WhisperSTTProvider(SpeechToTextProvider):
    """
    faster-whisper on CPU with int8 quantization.

    Configurable via environment variables (with sensible defaults for the
    Render free tier):
        WHISPER_MODEL       default "tiny.en"   — tiny.en, base.en, small.en
        WHISPER_BEAM_SIZE   default 1           — 1 = fast, 5 = more accurate
        WHISPER_VAD_FILTER  default "1"         — "0" to disable voice activity detection
    """

    _model = None
    _model_lock = threading.Lock()

    @classmethod
    def _get_model(cls):
        if cls._model is not None:
            return cls._model

        with cls._model_lock:
            # Double-check after acquiring the lock
            if cls._model is not None:
                return cls._model

            from faster_whisper import WhisperModel

            model_size = _env_str("WHISPER_MODEL", "tiny.en")
            logger.info("Loading faster-whisper model: %s (cpu, int8)", model_size)

            cls._model = WhisperModel(
                model_size,
                device="cpu",
                compute_type="int8",
            )
            logger.info("Model loaded.")
            return cls._model

    async def warm_up(self) -> None:
        """Preload the model so the first real request is fast."""
        try:
            await asyncio.to_thread(self._get_model)
        except Exception as exc:  # pragma: no cover — best-effort warm-up
            logger.warning("Warm-up failed: %s", exc)

    async def transcribe(
        self, audio_bytes: bytes, filename: str = "audio.webm"
    ) -> str:
        if not audio_bytes:
            return ""
        return await asyncio.to_thread(
            self._transcribe_sync, audio_bytes, filename
        )

    def _transcribe_sync(self, audio_bytes: bytes, filename: str) -> str:
        suffix = Path(filename).suffix or ".webm"

        # Write to a temp file — faster-whisper needs a path or file object.
        fd, tmp_path = tempfile.mkstemp(suffix=suffix)
        try:
            with os.fdopen(fd, "wb") as f:
                f.write(audio_bytes)

            model = self._get_model()
            beam_size = _env_int("WHISPER_BEAM_SIZE", 1)
            vad_filter = _env_str("WHISPER_VAD_FILTER", "1") not in ("0", "false", "False")

            segments, info = model.transcribe(
                tmp_path,
                language="en",
                initial_prompt=STEM_PROMPT,
                beam_size=beam_size,
                vad_filter=vad_filter,
                condition_on_previous_text=False,
            )

            text = " ".join(seg.text.strip() for seg in segments).strip()
            logger.info(
                "Transcribed %.1fs audio → %d chars (lang=%s, prob=%.2f)",
                info.duration if hasattr(info, "duration") else 0.0,
                len(text),
                getattr(info, "language", "?"),
                getattr(info, "language_probability", 0.0),
            )
            return text

        finally:
            try:
                Path(tmp_path).unlink(missing_ok=True)
            except OSError:
                pass