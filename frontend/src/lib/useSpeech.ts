import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech() {
  const [enabled, setEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  // Load voices (they populate asynchronously in most browsers)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    function loadVoices() {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
        // Pick a default: prefer English, then the first available
        if (!voiceURI) {
          const english =
            v.find((voice) => voice.lang.startsWith("en-US")) ||
            v.find((voice) => voice.lang.startsWith("en")) ||
            v[0];
          if (english) setVoiceURI(english.voiceURI);
        }
      }
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [voiceURI]);

  const speak = useCallback(
    (text: string, id?: string) => {
      if (!enabled) return;
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      if (!text.trim()) return;

      // Prevent re-speaking the same message
      if (id && id === lastSpokenIdRef.current) return;
      lastSpokenIdRef.current = id ?? null;

      // Cancel anything currently speaking so we don't overlap
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const selected = voices.find((v) => v.voiceURI === voiceURI);
      if (selected) {
        utterance.voice = selected;
        utterance.lang = selected.lang;
      }

      window.speechSynthesis.speak(utterance);
    },
    [enabled, voiceURI, voices]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  return {
    supported,
    enabled,
    setEnabled,
    voices,
    voiceURI,
    setVoiceURI,
    speak,
    stop,
  };
}