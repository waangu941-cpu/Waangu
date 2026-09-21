import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "../services/auth.service";
import { listMySessions, deleteSession } from "../services/session.service";
import { listMyBusinesses } from "../services/business.service";
import Header from "../components/Header";
import ConnectionBanner from "../components/ConnectionBanner";
import type { Session, Business } from "../types";

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | undefined>();
  const [displayName, setDisplayName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cancellation guard: without it, a user who navigates away mid-load
    // (or straight to /login when getCurrentUser resolves) risks a late
    // response calling setState after unmount.
    let cancelled = false;

    async function load() {
      const user = await getCurrentUser();
      if (cancelled) return;
      if (!user) {
        navigate("/login");
        return;
      }
      setEmail(user.email);
      setUserId(user.id);

      // These three are independent — fetching them sequentially with
      // `await` one after another (as before) adds up their latencies
      // instead of overlapping them. Promise.allSettled runs them
      // concurrently *and* lets one fail without blocking the other two
      // (unlike Promise.all, which would reject the whole batch).
      const [profileResult, sessionsResult, businessesResult] =
        await Promise.allSettled([
          getProfile(user.id),
          listMySessions(20),
          listMyBusinesses(user.id),
        ]);
      if (cancelled) return;

      if (profileResult.status === "fulfilled") {
        if (profileResult.value?.display_name) {
          setDisplayName(profileResult.value.display_name);
        }
      } else {
        // Non-fatal: falls back to no display name. Still worth logging so
        // a real backend issue doesn't go unnoticed.
        console.warn("Could not load profile:", profileResult.reason);
      }

      if (sessionsResult.status === "fulfilled") {
        setSessions(sessionsResult.value);
      } else {
        console.error("Could not load sessions:", sessionsResult.reason);
      }

      if (businessesResult.status === "fulfilled") {
        setBusinesses(businessesResult.value);
      } else {
        console.error("Could not load businesses:", businessesResult.reason);
      }

      // Previously these failures were fully swallowed — an empty "No
      // sessions yet" state looked identical to "sessions failed to load",
      // with no way for the user (or you, debugging a report) to tell the
      // difference. Surface it, without blocking the parts that did load.
      if (
        sessionsResult.status === "rejected" ||
        businessesResult.status === "rejected"
      ) {
        setError(
          "Some of your data couldn't be loaded. Try refreshing the page."
        );
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleDelete(sessionId: string, title: string) {
    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis will permanently remove the session and all its messages. This cannot be undone.`
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(sessionId);

    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not delete session."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const activeSessions = sessions.filter((s) => s.status === "active").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout userEmail={email} />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Hero welcome */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-[#1e40af] to-[#15803d] text-white p-6 sm:p-8 mb-6">
          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#eab308]/10 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#eab308] mb-2">
              EDU MARKET ZAMBIA
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">
              {timeOfDayGreeting()}
              {displayName ? `, ${displayName}` : ""} 👋
            </h2>
            <p className="text-sm sm:text-base text-blue-100 max-w-xl mb-5">
              {activeSessions > 0
                ? `You have ${activeSessions} active ${
                    activeSessions === 1 ? "session" : "sessions"
                  }. Keep the conversation going.`
                : "Ready to make communication easier today? Choose a mode below to begin."}
            </p>

            {/* Mission strip */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 text-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                Different Abilities, Same Dreams
              </span>
              <span className="flex items-center gap-1.5 text-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]" />
                Learn • Teach • Connect
              </span>
            </div>
          </div>
        </section>

        {/* Connection banner */}
        <ConnectionBanner className="mb-6" />

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4"
          >
            {error}
          </div>
        )}

        {/* Mode cards */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-500 mb-3">
            CHOOSE A MODE
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/create-session?mode=education")}
              className="text-left bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border-l-4 border-blue-900"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎓</span>
                <h4 className="font-semibold text-blue-900 text-lg">
                  Education
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                Teach and learn in a classroom session with real-time captions.
              </p>
            </button>

            <button
              onClick={() => navigate("/create-session?mode=community")}
              className="text-left bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border-l-4 border-yellow-400"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💬</span>
                <h4 className="font-semibold text-blue-900 text-lg">
                  Community
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                Start a conversation with family, friends, or anyone.
              </p>
            </button>

            <button
              onClick={() => navigate("/learn-zsl")}
              className="text-left bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border-l-4 border-purple-700"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🤟</span>
                <h4 className="font-semibold text-blue-900 text-lg">
                  Learn Sign Language
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                Verified ZSL categories — content added with Deaf partners.
              </p>
            </button>

            <button
              onClick={() => navigate("/places")}
              className="text-left bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border-l-4 border-green-700"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🏥</span>
                <h4 className="font-semibold text-blue-900 text-lg">
                  Find accessible places
                </h4>
              </div>
              <p className="text-sm text-gray-600">
                Browse hospitals, shops, and services with accessible
                communication.
              </p>
            </button>
          </div>
        </div>

        {/* Business banner */}
        <button
          onClick={() => navigate("/business/onboarding")}
          className="w-full text-left bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border-l-4 border-green-700 mb-6"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">🏪</span>
            <div className="min-w-0">
              <h4 className="font-semibold text-blue-900 text-lg mb-1">
                Register your business or organisation
              </h4>
              <p className="text-sm text-gray-600">
                Get a permanent QR code for accessible communication. For
                shops, hospitals, clinics, banks, government offices, and
                community organisations.
              </p>
            </div>
          </div>
        </button>

        {/* Quick actions */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-500 mb-3">
            QUICK ACTIONS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/scan")}
              className="w-full bg-yellow-400 text-blue-900 py-3 rounded-lg font-medium hover:bg-yellow-300 transition min-h-[48px]"
            >
              📷 Scan QR code
            </button>
            <button
              onClick={() => navigate("/join-session")}
              className="w-full bg-yellow-400 text-blue-900 py-3 rounded-lg font-medium hover:bg-yellow-300 transition min-h-[48px]"
            >
              Join with a code
            </button>
          </div>
        </div>

        {/* Your businesses */}
        {businesses.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-3">
              Your businesses
            </h3>
            <div className="bg-white shadow-md rounded-lg divide-y">
              {businesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/business/${b.id}`)}
                  className="w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-blue-900 truncate">
                      {b.name}
                    </p>
                    {b.category && (
                      <p className="text-sm text-gray-600 truncate">
                        {b.category}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 flex-shrink-0">
                    Manage
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Your sessions */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-blue-900">Your sessions</h3>
          {sessions.length > 0 && (
            <span className="text-xs text-gray-500">
              {sessions.length} total
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white shadow-sm rounded-lg p-8 text-center text-gray-500 text-sm">
            Loading your sessions…
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-gray-600 mb-1">No sessions yet.</p>
            <p className="text-sm text-gray-500">
              Create one above to get started.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg divide-y">
            {sessions.map((s) => {
              const canDelete = s.created_by === userId;
              const isDeleting = deletingId === s.id;

              return (
                <div
                  key={s.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50"
                >
                  <button
                    onClick={() => navigate(`/session/${s.id}`)}
                    className="text-left min-w-0 flex-1"
                  >
                    <p className="font-medium text-blue-900 truncate">
                      {s.title}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {s.session_type === "community"
                        ? "Community"
                        : s.session_type === "business"
                        ? "Business"
                        : s.subject}{" "}
                      • Code:{" "}
                      <span className="font-mono">{s.join_code}</span>
                    </p>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        s.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.status}
                    </span>

                    {canDelete && (
                      <button
                        onClick={() => handleDelete(s.id, s.title)}
                        disabled={isDeleting}
                        aria-label={`Delete ${s.title}`}
                        title="Delete session"
                        className="text-gray-400 hover:text-red-600 transition disabled:opacity-50 p-1"
                      >
                        {isDeleting ? (
                          <span className="text-xs text-gray-500">...</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer signature */}
        <p className="text-center text-xs text-gray-400 mt-10">
          EduMarket Zambia · Learn • Teach • Connect
        </p>
      </main>
    </div>
  );
}