import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

export default function JoinSession() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanCode = code.trim().toUpperCase();

    const { data, error: rpcError } = await supabase.rpc("join_session_by_code", {
      p_code: cleanCode,
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    if (!data || data.length === 0) {
      setError("Session not found.");
      return;
    }

    navigate(`/session/${data[0].out_session_id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-md mx-auto mt-12 px-4 pb-16">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">Join a session</h2>
          <p className="text-gray-600 text-sm mb-6">
            Enter the 6-character code your teacher shared with you.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Session code
              </label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC123"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 text-blue-900 py-2 rounded-md font-medium hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join session"}
            </button>
          </form>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full mt-3 text-sm text-gray-600 hover:text-blue-900"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    </div>
  );
}