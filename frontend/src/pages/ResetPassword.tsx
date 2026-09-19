import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword } from "../services/auth.service";
import { supabase } from "../services/supabase";
import Logo from "../components/Logo";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase puts the recovery token in the URL hash; the client picks it up
  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();
      setValid(Boolean(data.session));
      setReady(true);
    }
    check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValid(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="lg:hidden bg-gradient-to-r from-[#1e3a8a] to-[#15803d] text-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Logo className="h-9 w-9 flex-shrink-0" />
          <div className="text-base font-bold">
            EduMarket <span className="text-[#eab308]">Zambia</span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">
              Set a new password
            </h1>

            {!ready ? (
              <p className="text-sm text-gray-500">Verifying link…</p>
            ) : done ? (
              <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-4">
                <p className="font-medium mb-1">✓ Password updated</p>
                <p>Taking you to your dashboard…</p>
              </div>
            ) : !valid ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  This reset link is invalid or has expired. Please request a
                  new one.
                </div>
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e40af] transition"
                >
                  Request new link
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  Choose a new password. It must be at least 6 characters.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      New password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Confirm password
                    </label>
                    <input
                      id="confirm"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e40af] transition disabled:opacity-50 min-h-[48px]"
                  >
                    {loading ? "Updating…" : "Update password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}