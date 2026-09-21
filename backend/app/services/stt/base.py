from abc import ABC, abstractmethod


class TranscriptionError(RuntimeError):
    """Raised by any provider when audio can't be transcribed (bad/corrupt
    audio, decode failure, provider-specific runtime error, etc.).

    Defined here rather than per-provider so callers (routers) can catch one
    exception type regardless of which STT_PROVIDER is active — a provider
    swap shouldn't mean hunting down every except clause that named a
    provider-specific error class.
    """


class SpeechToTextProvider(ABC):
    """Abstract STT provider. Swap implementations via STT_PROVIDER env var."""

    @property
    def name(self) -> str:
        """Human-readable identifier for logging (e.g. "WhisperSTTProvider")."""
        return type(self).__name__

    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        """
        Return the transcript for the given audio bytes.

        Args:
            audio_bytes: Raw audio file contents.
            filename: Original filename/extension, as a hint for format
                detection. Implementations that don't need it may ignore it.
        Returns:
            The transcript as a plain string. Empty string if no speech
            detected, or if audio_bytes is empty.
        Raises:
            TranscriptionError: if the audio can't be transcribed (corrupt
                data, decode failure, provider-specific error, etc.). Callers
                should catch this specifically rather than a bare Exception.
        """
        ...

    async def warm_up(self) -> None:
        """
        Optional: preload any heavy resources (models, etc.) so the first
        real request is fast. Default: no-op. Must not raise — callers treat
        warm-up as best-effort and only log failures.
        """
        return None