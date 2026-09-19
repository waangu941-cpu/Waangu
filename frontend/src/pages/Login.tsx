import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signIn } from "../services/auth.service";
import Logo from "../components/Logo";
import BrandPanel from "../components/BrandPanel";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  const registerHref =
    next !== "/dashboard"
      ? `/register?next=${encodeURIComponent(next)}`
      : "/register";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <BrandPanel />

      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen lg:min-h-0">
        <div className="lg:hidden bg-gradient-to-r from-[#1e3a8a] to-[#15803d] text-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-base font-bold leading-tight truncate">
                EduMarket <span className="text-[#eab308]">Zambia</span>
              </div>
              <div className="text-[9px] font-semibold tracking-[0.15em] text-[#eab308] mt-0.5">
                LEARN • TEACH • CONNECT
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center px-5 py-8 sm:px-8 sm:py-12 lg:min-h-full">
            <div className="w-full max-w-md">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Welcome back
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Sign in to continue to your EduMarket dashboard.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-semibold text-base hover:bg-[#1e40af] active:bg-[#1e40af] transition disabled:opacity-50 shadow-sm min-h-[48px]"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-right text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-[#1e3a8a] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </p>
              </form>

              <p className="text-sm text-gray-600 mt-6 sm:mt-8 text-center">
                Don't have an account?{" "}
                <Link
                  to={registerHref}
                  className="text-[#1e3a8a] font-semibold hover:underline"
                >
                  Create one
                </Link>
              </p>

              <div className="mt-8 sm:mt-12 pt-5 border-t border-gray-200 text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Built for schools, businesses, hospitals, and communities
                  across Zambia ·{" "}
                  <span className="text-[#15803d] font-medium">
                    Inclusive by design
                  </span>
                </p>
                <p className="text-xs">
                  <Link
                    to="/privacy"
                    className="text-[#1e3a8a] hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}