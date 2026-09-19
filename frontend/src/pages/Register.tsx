import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signUp, createProfile, recordConsent } from "../services/auth.service";
import Logo from "../components/Logo";
import BrandPanel from "../components/BrandPanel";
import type { UserRole } from "../types";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("teacher");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    agreePrivacy && agreeAge && email.trim() && password && displayName.trim();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreePrivacy || !agreeAge) {
      setError("Please confirm both consent statements before continuing.");
      return;
    }

    setLoading(true);

    try {
      const data = await signUp(email, password);

      if (!data.user) {
        throw new Error(
          "Account created but no user was returned. Please try logging in."
        );
      }

      await createProfile({
        id: data.user.id,
        display_name: displayName,
        role,
      });

      // Record consent — non-fatal if this fails
      try {
        await recordConsent("data_processing", "v1.0");
      } catch (consentErr) {
        console.warn("Consent record failed:", consentErr);
      }

      navigate(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create account."
      );
    } finally {
      setLoading(false);
    }
  }

  const loginHref =
    next !== "/dashboard"
      ? `/login?next=${encodeURIComponent(next)}`
      : "/login";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <BrandPanel
        headline="Join the Movement for Inclusive Communication"
        subheadline="Create your EduMarket Zambia account and give every person — Deaf and hearing — a voice in the classroom, the workplace, and the community."
      />

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
                  Create your account
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Join EduMarket Zambia and start communicating inclusively.
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
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Display name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    I am a
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition bg-white"
                  >
                    <optgroup label="Education">
                      <option value="teacher">Teacher</option>
                      <option value="deaf_student">Deaf student</option>
                      <option value="hearing_student">Hearing student</option>
                      <option value="admin">School administrator</option>
                      <option value="interpreter">
                        Sign-language interpreter
                      </option>
                    </optgroup>
                    <optgroup label="Community">
                      <option value="community_user">Community member</option>
                      <option value="parent_guardian">Parent / Guardian</option>
                    </optgroup>
                    <optgroup label="Business / Organisation">
                      <option value="business_owner">Business owner</option>
                      <option value="business_staff">Business staff</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="other">Other</option>
                    </optgroup>
                  </select>
                </div>

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
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    At least 6 characters.
                  </p>
                </div>

                {/* Consent checkboxes */}
                <div className="space-y-3 pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 tracking-wide pt-2">
                    BEFORE YOU CONTINUE
                  </p>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-0.5 w-4 h-4 flex-shrink-0 accent-[#1e3a8a]"
                    />
                    <span className="text-sm text-gray-700 leading-snug">
                      I have read and agree to the{" "}
                      <Link
                        to="/privacy"
                        target="_blank"
                        className="text-[#1e3a8a] font-medium hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeAge}
                      onChange={(e) => setAgreeAge(e.target.checked)}
                      className="mt-0.5 w-4 h-4 flex-shrink-0 accent-[#1e3a8a]"
                    />
                    <span className="text-sm text-gray-700 leading-snug">
                      I am 18 or older, <strong>or</strong> my parent or
                      guardian has given consent for me to use EduMarket
                      Zambia.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-semibold text-base hover:bg-[#1e40af] active:bg-[#1e40af] transition disabled:opacity-50 shadow-sm min-h-[48px]"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <p className="text-sm text-gray-600 mt-6 sm:mt-8 text-center">
                Already have an account?{" "}
                <Link
                  to={loginHref}
                  className="text-[#1e3a8a] font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </p>

              <div className="mt-8 sm:mt-12 pt-5 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  For schools, businesses, hospitals, and communities across
                  Zambia ·{" "}
                  <span className="text-[#15803d] font-medium">
                    Inclusive by design
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}