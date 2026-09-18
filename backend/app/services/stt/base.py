from abc import ABC, abstractmethod


class SpeechToTextProvider(ABC):
    """Abstract STT provider. Swap via STT_PROVIDER env var."""

    @abstractmethod
    async def transcribe(
        self, audio_bytes: bytes, filename: str = "audio.webm"
    ) -> str:
        ...
