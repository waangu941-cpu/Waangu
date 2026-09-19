from .base import SpeechToTextProvider


class StubSTTProvider(SpeechToTextProvider):
    """Fallback provider used when faster-whisper isn't installed or configured."""

    async def transcribe(
        self, audio_bytes: bytes, filename: str = "audio.webm"
    ) -> str:
        size_kb = len(audio_bytes) // 1024
        return (
            f"[STT stub] Received {size_kb} KB audio. "
            "Real transcription is not enabled on this deployment."
        )