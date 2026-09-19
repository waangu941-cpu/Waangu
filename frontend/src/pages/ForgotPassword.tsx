import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/auth.service";
import Logo from "../components/Logo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send reset email."
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
              Reset your password
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              Enter the email you signed up with. We'll send you a link to set a
              new password.
            </p>

            {sent ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-4">
                  <p className="font-medium mb-1">✓ Check your inbox</p>
                  <p>
                    If an account exists for <strong>{email}</strong>, we've
                    sent a password reset link. The link expires in 1 hour.
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  Didn't get the email? Check your spam folder, or wait a few
                  minutes and try again.
                </p>

                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="w-full text-sm text-blue-900 hover:underline py-2"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
                      placeholder="you@school.zm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-semibold hover:bg-[#1e40af] transition disabled:opacity-50 min-h-[48px]"
                  >
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                </form>
              </>
            )}

            <p className="text-sm text-gray-600 mt-6 text-center">
              <Link
                to="/login"
                className="text-[#1e3a8a] font-semibold hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}