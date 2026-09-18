from .base import SpeechToTextProvider


class StubSTTProvider(SpeechToTextProvider):
    async def transcribe(
        self, audio_bytes: bytes, filename: str = "audio.webm"
    ) -> str:
        return "[STT stub] Placeholder caption. Real transcription coming soon."
