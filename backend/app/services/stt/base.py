from abc import ABC, abstractmethod


class SpeechToTextProvider(ABC):
    """Abstract STT provider. Swap implementations via STT_PROVIDER env var."""

    @abstractmethod
    async def transcribe(
        self, audio_bytes: bytes, filename: str = "audio.webm"
    ) -> str:
        """
        Return the transcript for the given audio bytes.

        Args:
            audio_bytes: Raw audio file contents.
            filename: Original filename (used to pick a temp-file suffix).
        Returns:
            The transcript as a plain string. Empty string if no speech detected.
        """
        ...

    async def warm_up(self) -> None:
        """
        Optional: preload any heavy resources (models, etc.) so the first
        real request is fast. Default: no-op.
        """
        return None