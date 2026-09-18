import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import AudioRecorder from "../components/AudioRecorder";
import { useSpeech } from "../lib/useSpeech";

interface Message {
  id: string;
  session_id: string;
  sender_id: string | null;
  message_type: "text" | "transcript_partial" | "transcript_final" | "system";
  content: string;
  created_at: string;
}

interface SessionInfo {
  id: string;
  title: string;
  subject: string;
  join_code: string;
  created_by: string;
}

export default function SessionRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const speech = useSpeech();

  // Load session + user
  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate("/login");
        return;
      }
      setUserId(userData.user.id);

      const { data: sessionData, error: sErr } = await supabase
        .from("sessions")
        .select("id, title, subject, join_code, created_by")
        .eq("id", id)
        .single();

      if (sErr || !sessionData) {
        setError("Session not found or you don't have access.");
        setLoading(false);
        return;
      }
      setSession(sessionData);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", id)
        .order("created_at", { ascending: true });

      if (msgs) setMessages(msgs as Message[]);

      setLoading(false);
    }
    load();
  }, [id, navigate]);

  // Realtime subscription — also speaks incoming text messages
  useEffect(() => {
    if (!id || !userId) return;

    const channel = supabase
      .channel(`session-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);

          // Speak incoming text messages from OTHER users
          if (
            newMsg.message_type === "text" &&
            newMsg.sender_id !== userId &&
            newMsg.content.trim()
          ) {
            speech.speak(newMsg.content, newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !id || !userId) return;

    const text = input.trim();
    setInput("");

    const { error: insErr } = await supabase.from("messages").insert({
      session_id: id,
      sender_id: userId,
      message_type: "text",
      content: text,
    });

    if (insErr) {
      setError("Failed to send: " + insErr.message);
    }
  }

  async function insertTranscript(text: string) {
    if (!id || !userId) return;

    const { error: insErr } = await supabase.from("messages").insert({
      session_id: id,
      sender_id: userId,
      message_type: "transcript_final",
      content: text,
    });

    if (insErr) {
      setError("Failed to save caption: " + insErr.message);
    }
  }

  async function endSession() {
    if (!id) return;
    const { error } = await supabase
      .from("sessions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setError("Failed to end session: " + error.message);
      return;
    }
    navigate("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-600">
          Loading session...
        </main>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-red-700 mb-4">{error}</p>
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

  const isTeacher = session?.created_by === userId;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showLogout />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col">
        {/* Session info bar */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-blue-900">{session?.title}</h2>
            <p className="text-sm text-gray-600">
              {session?.subject} • Code:{" "}
              <span className="font-mono font-bold text-blue-900">
                {session?.join_code}
              </span>
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={endSession}
              className="text-sm px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
            >
              End session
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-2 mb-3">
            {error}
          </div>
        )}

        {/* TTS control bar */}
        {speech.supported ? (
          <div className="bg-white shadow-sm rounded-lg p-3 mb-3 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={speech.enabled}
                onChange={(e) => {
                  speech.setEnabled(e.target.checked);
                  if (!e.target.checked) speech.stop();
                }}
                className="w-4 h-4"
              />
              <span className="font-medium text-blue-900">
                Speak incoming messages
              </span>
            </label>

            {speech.enabled && speech.voices.length > 0 && (
              <select
                value={speech.voiceURI ?? ""}
                onChange={(e) => speech.setVoiceURI(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[240px]"
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
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded p-2 mb-3">
            Text-to-speech is not supported in this browser. Messages will still appear as text.
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 bg-white shadow-sm rounded-lg p-4 overflow-y-auto mb-4 min-h-[400px]"
        >
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-8">
              No messages yet. Type below to start the conversation.
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === userId;
            const isCaption = m.message_type === "transcript_final";
            return (
              <div
                key={m.id}
                className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    mine
                      ? "bg-blue-900 text-white"
                      : isCaption
                      ? "bg-yellow-100 text-blue-900 border border-yellow-300"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {isCaption && (
                    <div className="text-xs font-semibold text-yellow-800 mb-1">
                      📝 Caption
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p
                    className={`text-xs mt-1 ${
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
        <div className="space-y-3">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Type a message"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-blue-900 text-white px-6 rounded-md font-medium hover:bg-blue-800 disabled:opacity-50"
            >
              Send
            </button>
          </form>

          <div className="flex items-center justify-between bg-white rounded-md p-3 border border-gray-200">
            <span className="text-sm text-gray-600">
              Hearing user: speak and your words appear as captions.
            </span>
            <AudioRecorder
              onTranscribed={insertTranscript}
              onError={setError}
            />
          </div>
        </div>
      </main>
    </div>
  );
}