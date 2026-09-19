import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBusinessByQrToken,
  startBusinessSessionFromQr,
  hasAvailableStaff,
  createCommunicationRequest,
  getMyPendingRequest,
  cancelMyRequest,
  type CommunicationRequest,
} from "../services/business.service";
import { getCurrentUser } from "../services/auth.service";
import Header from "../components/Header";
import type { Business } from "../types";
import { useToast } from "../hooks/useToast";

export default function BusinessPublicView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [business, setBusiness] = useState<Business | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [staffAvailable, setStaffAvailable] = useState<boolean | null>(null);
  const [myRequest, setMyRequest] = useState<CommunicationRequest | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [preference, setPreference] = useState<"text" | "speech" | "tts">("text");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;

      try {
        const user = await getCurrentUser();
        setUserId(user?.id ?? null);

        const biz = await getBusinessByQrToken(token);
        if (!biz) {
          setError("This communication link is no longer available.");
          setLoading(false);
          return;
        }
        setBusiness(biz);

        const avail = await hasAvailableStaff(biz.id).catch(() => null);
        setStaffAvailable(avail);

        if (user) {
          const req = await getMyPendingRequest(biz.id, user.id);
          if (req) setMyRequest(req);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not load this business."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleStartConversation() {
    if (!token) return;
    setError(null);
    setStarting(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate(`/login?next=/b/${token}`);
        return;
      }
      const sessionId = await startBusinessSessionFromQr(token, preference);
      navigate(`/session/${sessionId}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not start conversation."
      );
    } finally {
      setStarting(false);
    }
  }

   async function handleSubmitRequest(e: FormEvent) {
    e.preventDefault();
    if (!business) return;
    setError(null);
    setSubmitting(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate(`/login?next=/b/${token}`);
        return;
      }

      const requestId = await createCommunicationRequest(
        business.id,
        requestMessage
      );
      const req = await getMyPendingRequest(business.id, user.id);
      if (req) setMyRequest(req);
      setRequestMessage("");
      void requestId;
      push("Request sent. Staff will respond when available.", "success");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not send your request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelRequest() {
    if (!myRequest) return;
    setError(null);
    try {
      await cancelMyRequest(myRequest.id);
      setMyRequest(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-md mx-auto px-4 py-16 text-center text-gray-600">
          Loading business...
        </main>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-700 mb-6">{error}</p>
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
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-md mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-green-700 px-6 py-6 text-white">
            <div className="text-xs font-semibold text-yellow-300 tracking-widest mb-1">
              ACCESSIBLE COMMUNICATION
            </div>
            <h1 className="text-2xl font-bold">{business?.name}</h1>
            {business?.category && (
              <p className="text-sm text-blue-100 mt-1">
                {business.category}
                {business.location && ` • ${business.location}`}
              </p>
            )}
            {staffAvailable !== null && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-3 py-1 text-xs font-medium">
                <span>{staffAvailable ? "🟢" : "🔴"}</span>
                <span>
                  {staffAvailable
                    ? "Staff available"
                    : "No staff available right now"}
                </span>
              </div>
            )}
          </div>

          <div className="p-6">
            {business?.description && (
              <p className="text-sm text-gray-600 mb-6">
                {business.description}
              </p>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
                {error}
              </div>
            )}

            {/* Already have a pending request */}
            {myRequest ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4">
                <p className="font-medium mb-1">Your request is in the queue</p>
                <p className="text-sm mb-3">
                  A staff member will respond as soon as someone is available.
                  {myRequest.message && (
                    <>
                      <br />
                      <span className="italic">"{myRequest.message}"</span>
                    </>
                  )}
                </p>
                <button
                  onClick={handleCancelRequest}
                  className="text-sm text-red-700 hover:underline"
                >
                  Cancel request
                </button>
              </div>
            ) : staffAvailable ? (
              <>
                                <p className="text-sm text-gray-700 mb-3">
                  How would you like to communicate?{" "}
                  <span className="text-xs text-gray-500">
                    (Pick the one that fits you best — you can still use any of
                    them in the chat.)
                  </span>
                </p>

                <div className="space-y-2 mb-6">
                  {(
                    [
                      {
                        key: "text",
                        icon: "💬",
                        label: "Type messages",
                        desc: "I'll type. They read.",
                      },
                      {
                        key: "speech",
                        icon: "🎤",
                        label: "Speech captions",
                        desc: "They speak. I read captions.",
                      },
                      {
                        key: "tts",
                        icon: "🔊",
                        label: "Text-to-speech",
                        desc: "I type. They hear it.",
                      },
                    ] as const
                  ).map((opt) => {
                    const selected = preference === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPreference(opt.key)}
                        aria-pressed={selected}
                        className={`w-full text-left rounded-lg border-2 p-3 transition flex items-center gap-3 ${
                          selected
                            ? "border-blue-900 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-gray-900">
                            {opt.label}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {opt.desc}
                          </span>
                        </span>
                        {selected && (
                          <span
                            className="text-blue-900 font-bold flex-shrink-0"
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleStartConversation}
                  disabled={starting}
                  className="w-full bg-blue-900 text-white py-3 rounded-md font-medium hover:bg-blue-800 transition disabled:opacity-50 min-h-[48px]"
                >
                  {starting ? "Starting..." : "Start conversation"}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Your conversation is private — other customers cannot see it.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 mb-4">
                  No staff members are available right now. You can leave a
                  short message and someone will get back to you.
                </p>

                <form onSubmit={handleSubmitRequest} className="space-y-3">
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    rows={3}
                    placeholder="e.g. I'd like help choosing a phone."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-900 text-white py-3 rounded-md font-medium hover:bg-blue-800 transition disabled:opacity-50 min-h-[48px]"
                  >
                    {submitting ? "Sending..." : "Leave a request"}
                  </button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Your message goes only to this business.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}