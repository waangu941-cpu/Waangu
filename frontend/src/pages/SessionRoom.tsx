import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession, endSession } from "../services/session.service";
import { supabase } from "../services/supabase";
import { getCurrentUser, getProfile } from "../services/auth.service";
import { useMessages } from "../hooks/useMessages";
import { useSpeech } from "../hooks/useSpeech";
import Header from "../components/Header";
import AudioRecorder from "../components/AudioRecorder";
import ConnectionBanner from "../components/ConnectionBanner";
import type { Session } from "../types";

function initials(nameOrEmail?: string): string {
  if (!nameOrEmail) return "?";
  const clean = nameOrEmail.split("@")[0];
  const parts = clean.split(/[\s._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export default function SessionRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("You");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isBusinessStaff, setIsBusinessStaff] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const speech = useSpeech();

  const {
    messages,
    error: messageError,
    send,
    clearError: clearMessageError,
  } = useMessages({
    sessionId: id,
    currentUserId: userId,
    onIncoming: (msg) => {
      if (msg.message_type === "text" && msg.content.trim()) {
        speech.speak(msg.content, msg.id);
      }
    },
  });

  // Load session + user
  useEffect(() => {
    // Guards against two failure modes that are easy to miss in a plain
    // `load()` call: (1) setState firing after the component has unmounted
    // (React warns, and it's wasted work), and (2) a stale response landing
    // after `id` has already changed — e.g. the user navigates from one
    // session to another before the first session's fetch resolves, and its
    // late response overwrites the second session's freshly-loaded state.
    let cancelled = false;

    async function load() {
      if (!id) return;

      const user = await getCurrentUser();
      if (cancelled) return;
      if (!user) {
        navigate("/login");
        return;
      }
      setUserId(user.id);

      try {
        const profile = await getProfile(user.id);
        if (cancelled) return;
        if (profile?.display_name) setDisplayName(profile.display_name);
      } catch (e) {
        // Non-fatal: falls back to the "You" default. Still worth a log so
        // a real backend/permissions problem doesn't go unnoticed.
        console.warn("Could not load profile:", e);
      }

      try {
        const s = await getSession(id);
        if (cancelled) return;
        if (!s) {
          setLoadError("Session not found or you don't have access.");
        } else {
          setSession(s);

          if (s.session_type === "business" && s.business_id) {
            const { data: staffRow, error: staffError } = await supabase
              .from("business_staff")
              .select("id")
              .eq("business_id", s.business_id)
              .eq("user_id", user.id)
              .maybeSingle();
            if (cancelled) return;
            if (staffError) {
              // Don't silently treat a failed check as "not staff" — log it
              // so an RLS/permissions regression is visible instead of just
              // quietly hiding the "End session" button from real staff.
              console.error("Staff lookup failed:", staffError);
            }
            setIsBusinessStaff(Boolean(staffRow));
          }
        }
      } catch (e) {
        if (cancelled) return;
        setLoadError(
          e instanceof Error ? e.message : "Could not load session."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Stop any in-progress text-to-speech when leaving the room — otherwise a
  // message can keep being read aloud after the user has navigated away.
  useEffect(() => {
    return () => {
      speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !id || !userId) return;

    const text = input.trim();
    setInput("");
    setSendError(null);

    await send({
      sender_id: userId,
      content: text,
      message_type: "text",
    });
  }

  async function handleTranscript(text: string) {
    if (!id || !userId) return;
    await send({
      sender_id: userId,
      content: text,
      message_type: "transcript_final",
    });
  }

  async function handleEndSession() {
    if (!id) return;
    if (!window.confirm("End this conversation for everyone?")) return;
    try {
      await endSession(id);
      navigate("/dashboard");
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Could not end session.");
    }
  }

  const combinedError = loadError ?? sendError ?? messageError;

  const isCreator = session?.created_by === userId;
  const isCommunity = session?.session_type === "community";
  const isBusiness = session?.session_type === "business";
  const preference = session?.communication_preference;

  const typeLabel = useMemo(() => {
    if (isCommunity) return "Community";
    if (isBusiness) return "Business";
    return "Education";
  }, [isCommunity, isBusiness]);

  const typeColor = useMemo(() => {
    if (isCommunity) return "border-yellow-400";
    if (isBusiness) return "border-green-700";
    return "border-blue-900";
  }, [isCommunity, isBusiness]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-600">
          <div className="inline-block animate-pulse">
            <div className="text-4xl mb-2">💬</div>
            <p>Loading session…</p>
          </div>
        </main>
      </div>
    );
  }

  if (loadError && !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-700 mb-4">{loadError}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-900 underline"
          >
            Back to dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showLogout />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col">
        {/* Session header card */}
        <div
          className={`bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#15803d] text-white rounded-xl shadow-md p-4 sm:p-5 mb-4 border-l-4 ${typeColor}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold tracking-[0.2em] text-[#eab308] mb-1">
                {typeLabel.toUpperCase()} SESSION
              </div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight mb-1 truncate">
                {session?.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap text-xs text-blue-100">
                {!isCommunity && !isBusiness && session?.subject && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                    {session.subject}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                  Code:
                  <span className="font-mono font-bold text-[#eab308] tracking-widest">
                    {session?.join_code}
                  </span>
                </span>
              </div>
            </div>

            {(isCreator || isBusinessStaff) && (
              <button
                onClick={handleEndSession}
                className="text-xs px-3 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 flex-shrink-0 transition"
              >
                {isCommunity || isBusiness ? "End" : "End session"}
              </button>
            )}
          </div>
        </div>

        {/* Preference pill */}
        {preference && preference !== "any" && (
          <div className="text-xs text-gray-600 mb-3 flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-medium">
              {preference === "text" && "💬 Type messages"}
              {preference === "speech" && "🎤 Speech captions"}
              {preference === "tts" && "🔊 Text-to-speech"}
            </span>
            <span>is the preferred mode for this conversation.</span>
          </div>
        )}

        {/* Connection status */}
        <ConnectionBanner />

        {/* Error banner */}
        {combinedError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-3 flex items-start justify-between gap-2">
            <span>{combinedError}</span>
            <button
              onClick={() => {
                clearMessageError();
                setSendError(null);
                setLoadError(null);
              }}
              className="text-red-500 hover:text-red-700 text-lg leading-none"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Waiting-for-staff */}
        {isBusiness && messages.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg p-3 mb-3">
            <strong className="font-medium">Waiting for staff…</strong>{" "}
            Someone from this business will join shortly. You can start typing
            if you'd like.
          </div>
        )}

        {/* TTS bar */}
        {speech.supported && (
          <div className="bg-white shadow-sm rounded-lg p-3 mb-3 flex items-center justify-between gap-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer min-w-0">
              <input
                type="checkbox"
                checked={speech.enabled}
                onChange={(e) => {
                  speech.setEnabled(e.target.checked);
                  if (!e.target.checked) speech.stop();
                }}
                className="w-4 h-4 flex-shrink-0"
              />
              <span className="font-medium text-blue-900 truncate">
                🔊 Speak incoming messages
              </span>
            </label>

            {speech.enabled && speech.voices.length > 0 && (
              <select
                value={speech.voiceURI ?? ""}
                onChange={(e) => speech.setVoiceURI(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[140px] sm:max-w-[240px]"
                aria-label="Text-to-speech voice"
              >
                {speech.voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="flex-1 bg-white shadow-sm rounded-xl p-3 sm:p-4 overflow-y-auto mb-3 min-h-[400px]"
        >
          {messages.length === 0 && (
            <div className="text-center mt-10 sm:mt-16 px-6">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-gray-700 font-medium mb-1">
                No messages yet
              </p>
              <p className="text-sm text-gray-500">
                Type below, or tap the microphone to speak.
              </p>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === userId;
            const isCaption = m.message_type === "transcript_final";
            const avatar = mine ? initials(displayName) : "•";

            return (
              <div
                key={m.id}
                className={`mb-3 flex items-end gap-2 ${
                  mine ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 ${
                    mine
                      ? "bg-[#1e3a8a] text-white"
                      : isCaption
                      ? "bg-yellow-400 text-blue-900"
                      : "bg-gray-200 text-gray-700"
                  }`}
                  aria-hidden="true"
                >
                  {avatar}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                    mine
                      ? "bg-[#1e3a8a] text-white rounded-br-sm"
                      : isCaption
                      ? "bg-yellow-50 text-blue-900 border border-yellow-300 rounded-bl-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
                >
                  {isCaption && (
                    <div className="text-[10px] font-semibold text-yellow-700 mb-1 tracking-wide uppercase">
                      📝 Caption
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm sm:text-base leading-snug">
                    {m.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      mine ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message input + microphone */}
        <div className="space-y-2">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              aria-label="Type a message"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="bg-[#1e3a8a] text-white px-5 sm:px-6 rounded-xl font-medium hover:bg-[#1e40af] active:bg-[#1e40af] disabled:opacity-50 transition min-h-[48px] flex items-center gap-2"
            >
              <span className="hidden sm:inline">Send</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200 gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-700">
                🎤 Speech → captions
              </p>
              <p className="text-[11px] text-gray-500 leading-tight">
                Speak clearly. Your words appear as captions for everyone.
              </p>
            </div>
            <AudioRecorder
              onTranscribed={handleTranscript}
              onError={(msg) => setSendError(msg)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}