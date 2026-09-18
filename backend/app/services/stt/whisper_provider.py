import asyncio
import tempfile
from pathlib import Path

from .base import SpeechToTextProvider


STEM_PROMPT = (
    "H2O, CO2, CH3COOH, C2H5OH, mitochondria, photosynthesis, chloroplast, "
    "Pythagorean theorem, quadratic formula, a squared plus b squared equals c squared, "
    "x equals negative b plus or minus the square root of b squared minus 4ac over 2a, "
    "chemical formula, biology, physics, mathematics, STEM, "
    "Zambian English, teacher, student, lesson."
)


class WhisperSTTProvider(SpeechToTextProvider):
    _model = None

    @classmethod
    def _get_model(cls, model_size: str = "base.en"):
        if cls._model is None:
            from faster_whisper import WhisperModel
            cls._model = WhisperModel(model_size, device="cpu", compute_type="int8")
        return cls._model

    async def transcribe(
        self, audio_bytes: bytes, filename: str = "audio.webm"
    ) -> str:
        return await asyncio.to_thread(self._transcribe_sync, audio_bytes, filename)

    def _transcribe_sync(self, audio_bytes: bytes, filename: str) -> str:
        suffix = Path(filename).suffix or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            model = self._get_model()
            segments, _info = model.transcribe(
                tmp_path,
                language="en",
                initial_prompt=STEM_PROMPT,
                beam_size=1,
                vad_filter=True,
            )
            return " ".join(seg.text.strip() for seg in segments).strip()
        finally:
            Path(tmp_path).unlink(missing_ok=True)
