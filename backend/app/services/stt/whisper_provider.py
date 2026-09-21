import asyncio
import logging
import os
import tempfile
import threading
from pathlib import Path

from .base import SpeechToTextProvider, TranscriptionError

logger = logging.getLogger(__name__)


# STEM vocabulary prompt — nudges the model toward technical terms.
STEM_PROMPT = (
    "H2O, CO2, CH3COOH, C2H5OH, mitochondria, photosynthesis, chloroplast, "
    "Pythagorean theorem, quadratic formula, a squared plus b squared equals c squared, "
    "x equals negative b plus or minus the square root of b squared minus 4ac over 2a, "
    "chemical formula, biology, physics, mathematics, STEM, "
    "Zambian English, teacher, student, lesson."
)

# Defense in depth: the API layer should already cap upload size, but this
# provider shouldn't trust that — it may get called from other code paths
# later (batch jobs, other routers) that don't apply the same limit.
MAX_AUDIO_BYTES = 20 * 1024 * 1024  # 20 MB

# Only extensions faster-whisper/ffmpeg is actually expected to see from this
# app. `filename` ultimately comes from a client-supplied upload, and while
# Path().suffix can't be used for path traversal (it discards any directory
# component), an unbounded/unexpected suffix is still worth rejecting rather
# than silently passing through to ffmpeg.
ALLOWED_SUFFIXES = {".webm", ".ogg", ".wav", ".mp3", ".m4a"}
DEFAULT_SUFFIX = ".webm"

def _env_str(key: str, default: str) -> str:
    return os.getenv(key, default).strip() or default


def _env_int(key: str, default: int) -> int:
    try:
        return int(os.getenv(key, str(default)))
    except ValueError:
        return default


# CPU-bound whisper inference run via asyncio.to_thread uses the default
# thread pool (up to ~32 workers). On a small/free-tier instance, letting
# that many transcriptions run concurrently will thrash the CPU and can OOM
# the process. Serialize/limit instead.
_MAX_CONCURRENT_TRANSCRIPTIONS = _env_int("WHISPER_MAX_CONCURRENCY", 1)
_transcription_semaphore = threading.Semaphore(_MAX_CONCURRENT_TRANSCRIPTIONS)


class WhisperSTTProvider(SpeechToTextProvider):
    """
    faster-whisper on CPU with int8 quantization.

    Configurable via environment variables (with sensible defaults for the
    Render free tier):
        WHISPER_MODEL         default "tiny.en"  — tiny.en, base.en, small.en
        WHISPER_BEAM_SIZE     default 1          — 1 = fast, 5 = more accurate
        WHISPER_VAD_FILTER    default "1"        — "0" to disable voice activity detection
        WHISPER_MAX_CONCURRENCY default 1        — max simultaneous transcriptions
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

            try:
                cls._model = WhisperModel(
                    model_size,
                    device="cpu",
                    compute_type="int8",
                )
            except Exception as exc:
                logger.error("Failed to load faster-whisper model %s: %s", model_size, exc)
                raise
            logger.info("Model loaded.")
            return cls._model

    async def warm_up(self) -> None:
        """Preload the model so the first real request is fast."""
        try:
            await asyncio.to_thread(self._get_model)
        except Exception as exc:  # pragma: no cover — best-effort warm-up
            logger.warning("Warm-up failed: %s", exc)

    async def transcribe(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        if not audio_bytes:
            return ""
        if len(audio_bytes) > MAX_AUDIO_BYTES:
            raise TranscriptionError(
                f"Audio exceeds max size of {MAX_AUDIO_BYTES // (1024 * 1024)} MB."
            )
        return await asyncio.to_thread(self._transcribe_sync, audio_bytes, filename)

    def _transcribe_sync(self, audio_bytes: bytes, filename: str) -> str:
        suffix = Path(filename).suffix.lower()
        if suffix not in ALLOWED_SUFFIXES:
            logger.warning("Rejecting unexpected upload suffix %r; using %s", suffix, DEFAULT_SUFFIX)
            suffix = DEFAULT_SUFFIX

        # mkstemp creates the file with 0600 permissions and a random name in
        # the system temp dir — no path traversal risk from `filename` here.
        fd, tmp_path = tempfile.mkstemp(suffix=suffix)
        try:
            with os.fdopen(fd, "wb") as f:
                f.write(audio_bytes)

            with _transcription_semaphore:
                return self._run_model(tmp_path)
        finally:
            try:
                Path(tmp_path).unlink(missing_ok=True)
            except OSError as exc:
                logger.warning("Failed to remove temp file %s: %s", tmp_path, exc)

    def _run_model(self, tmp_path: str) -> str:
        model = self._get_model()
        beam_size = _env_int("WHISPER_BEAM_SIZE", 1)
        vad_filter = _env_str("WHISPER_VAD_FILTER", "1") not in ("0", "false", "False")

        try:
            segments, info = model.transcribe(
                tmp_path,
                language="en",
                initial_prompt=STEM_PROMPT,
                beam_size=beam_size,
                vad_filter=vad_filter,
                condition_on_previous_text=False,
            )
            text = " ".join(seg.text.strip() for seg in segments).strip()
        except Exception as exc:
            # Covers ffmpeg decode failures (corrupt/empty/unsupported audio)
            # and any other runtime error from the model itself.
            logger.error("Transcription failed for %s: %s", tmp_path, exc)
            raise TranscriptionError("Could not transcribe audio.") from exc

        logger.info(
            "Transcribed %.1fs audio → %d chars (lang=%s, prob=%.2f)",
            getattr(info, "duration", 0.0),
            len(text),
            getattr(info, "language", "?"),
            getattr(info, "language_probability", 0.0),
        )
        return text