import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { joinSessionByCode } from "../services/session.service";
import Header from "../components/Header";


export default function JoinSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState((searchParams.get("code") || "").toUpperCase());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const sessionId = await joinSessionByCode(code);
      navigate(`/session/${sessionId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not join session.";
      setError(
        msg.includes("not found")
          ? "We couldn't find that session. Please check the code and try again."
          : msg
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-md mx-auto mt-8 sm:mt-12 px-4 pb-16">
        <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">
            Join a session
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Enter the 6-character code you were given.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Session code
              </label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full border border-gray-300 rounded-md px-3 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC123"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-blue-900 py-3 rounded-md font-medium hover:bg-yellow-300 transition disabled:opacity-50 min-h-[48px]"
            >
              {loading ? "Joining..." : "Join session"}
            </button>
          </form>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mt-3 text-sm text-gray-600 hover:text-blue-900 py-2"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    </div>
  );
}