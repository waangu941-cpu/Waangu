import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBusiness,
  getBusinessQrToken,
  acceptBusinessSession,
  listActiveBusinessSessions,
  listPendingRequests,
  respondToRequest,
  deleteBusiness,
  revokeQrCode,
  generateNewQrCode,
  type CommunicationRequest,
} from "../services/business.service";
import { getCurrentUser } from "../services/auth.service";
import { supabase } from "../services/supabase";
import { useToast } from "../hooks/useToast";
import Header from "../components/Header";
import QRCodeCard from "../components/QRCodeCard";
import StaffManager from "../components/StaffManager";
import type { Business, Session } from "../types";

export default function BusinessDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();

  // ── Core state ─────────────────────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [requests, setRequests] = useState<CommunicationRequest[]>([]);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────
  const [showQR, setShowQR] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deletingBusiness, setDeletingBusiness] = useState(false);

  const isOwner = business?.owner_id === userId;

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const user = await getCurrentUser();
        setUserId(user?.id ?? null);

        const biz = await getBusiness(id);
        if (!biz) {
          setError("Business not found.");
          setLoading(false);
          return;
        }
        setBusiness(biz);

        const [sess, token, reqs] = await Promise.all([
          listActiveBusinessSessions(id),
          getBusinessQrToken(id),
          listPendingRequests(id),
        ]);

        setSessions(sess);
        if (token) setPublicToken(token);
        setRequests(reqs);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Realtime subscriptions ─────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`business-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
          filter: `business_id=eq.${id}`,
        },
        (payload) => {
          const next = payload.new as Session;
          setSessions((prev) =>
            prev.some((s) => s.id === next.id) ? prev : [next, ...prev]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "communication_requests",
          filter: `business_id=eq.${id}`,
        },
        async () => {
          const reqs = await listPendingRequests(id);
          setRequests(reqs);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // ── Handlers ───────────────────────────────────────────────────────────
  async function acceptAndOpen(sessionId: string) {
    setError(null);
    setAccepting(sessionId);
    try {
      await acceptBusinessSession(sessionId);
      navigate(`/session/${sessionId}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not accept conversation."
      );
    } finally {
      setAccepting(null);
    }
  }

  async function respondToRequestById(requestId: string) {
    setError(null);
    setResponding(requestId);
    try {
      const { sessionId } = await respondToRequest(requestId);
      navigate(`/session/${sessionId}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not respond to request."
      );
    } finally {
      setResponding(null);
    }
  }

  async function handleRevokeQr() {
    if (!business || !userId) return;
    const confirmed = window.confirm(
      "Revoke this QR code?\n\nAny printed or shared QR will stop working immediately. Existing conversations are not affected. You can generate a new QR afterward."
    );
    if (!confirmed) return;

    setError(null);
    setRevoking(true);
    try {
      await revokeQrCode(business.id, userId);
      setPublicToken(null);
      setShowQR(false);
      push("QR code revoked. Generate a new one when ready.", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke QR.");
    } finally {
      setRevoking(false);
    }
  }

  async function handleRegenerateQr() {
    if (!business) return;
    setError(null);
    setRegenerating(true);
    try {
      const newToken = await generateNewQrCode(business.id);
      setPublicToken(newToken);
      setShowQR(true);
      push("New QR generated. Print and display it.", "success");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not generate new QR."
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDeleteBusiness() {
    if (!business) return;
    const confirmed = window.confirm(
      `Delete "${business.name}"?\n\nThis will remove the business, its QR codes, and its staff. Past conversations will be kept but unlinked. This cannot be undone.`
    );
    if (!confirmed) return;

    setError(null);
    setDeletingBusiness(true);
    try {
      await deleteBusiness(business.id);
      navigate("/dashboard");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not delete business."
      );
      setDeletingBusiness(false);
    }
  }

  // ── Early returns ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-600">
          <div className="inline-block animate-pulse">
            <div className="text-4xl mb-2">🏪</div>
            <p>Loading business…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-3">⚠️</div>
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

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />

      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Header card */}
        <div className="bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#15803d] text-white rounded-xl shadow-md p-5 mb-6">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-[#eab308] mb-1">
            BUSINESS DASHBOARD
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight truncate">
                {business?.name}
              </h1>
              {business?.category && (
                <p className="text-sm text-blue-100 mt-1">
                  {business.category}
                  {business.location && ` • ${business.location}`}
                </p>
              )}
            </div>

            {isOwner && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {publicToken ? (
                  <button
                    onClick={() => setShowQR((v) => !v)}
                    className="text-sm px-3 py-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white rounded-md font-medium hover:bg-white/25 transition"
                  >
                    {showQR ? "Hide QR" : "Show QR"}
                  </button>
                ) : (
                  <button
                    onClick={handleRegenerateQr}
                    disabled={regenerating}
                    className="text-sm px-3 py-2 bg-[#eab308] text-blue-900 rounded-md font-medium hover:bg-yellow-300 transition disabled:opacity-50"
                  >
                    {regenerating ? "Generating…" : "Generate QR"}
                  </button>
                )}
                <button
                  onClick={() => navigate(`/business/${business?.id}/edit`)}
                  className="text-sm px-3 py-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white rounded-md font-medium hover:bg-white/25 transition"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* QR card */}
        {showQR && isOwner && publicToken && business && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col items-center">
            <QRCodeCard
              businessName={business.name}
              publicToken={publicToken}
            />
            <button
              onClick={handleRevokeQr}
              disabled={revoking}
              className="mt-4 text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
            >
              {revoking ? "Revoking…" : "Revoke this QR code"}
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-1 max-w-xs">
              Revoking immediately disables this QR. Printed copies will stop
              working. You can generate a new one afterward.
            </p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {/* Staff */}
        {business && userId && (
          <div className="mb-6">
            <StaffManager
              businessId={business.id}
              ownerId={business.owner_id}
              currentUserId={userId}
            />
          </div>
        )}

        {/* Pending requests */}
        {requests.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold text-blue-900">
                Pending requests
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400 text-blue-900 font-medium">
                {requests.length}
              </span>
            </div>
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="bg-white shadow-sm rounded-lg p-4 border-l-4 border-yellow-400"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm text-gray-500">
                      Requested{" "}
                      {new Date(r.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <button
                      onClick={() => respondToRequestById(r.id)}
                      disabled={responding === r.id}
                      className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50 flex-shrink-0"
                    >
                      {responding === r.id ? "Opening…" : "Respond"}
                    </button>
                  </div>
                  {r.message ? (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {r.message}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      No message left.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incoming conversations */}
        <h2 className="text-lg font-bold text-blue-900 mb-3">
          Incoming conversations
        </h2>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-600 mb-1">No conversations yet.</p>
            <p className="text-sm text-gray-500">
              When a customer scans your QR code, their conversation will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-between gap-3 border-l-4 border-yellow-400"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-blue-900 truncate">
                    {s.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    Started{" "}
                    {new Date(s.started_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => acceptAndOpen(s.id)}
                  disabled={accepting === s.id}
                  className="bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50 flex-shrink-0"
                >
                  {accepting === s.id ? "Joining…" : "Accept"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Danger zone */}
        {isOwner && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-semibold tracking-widest text-red-700 mb-2">
              DANGER ZONE
            </p>
            <button
              onClick={handleDeleteBusiness}
              disabled={deletingBusiness}
              className="text-sm text-red-700 hover:text-red-900 hover:underline disabled:opacity-50"
            >
              {deletingBusiness ? "Deleting…" : "Delete this business"}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Removing a business also removes its QR codes and staff. Past
              conversations are kept but unlinked. This cannot be undone.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full mt-6 text-sm text-gray-600 hover:text-blue-900 py-2"
        >
          Back to dashboard
        </button>
      </main>
    </div>
  );
}