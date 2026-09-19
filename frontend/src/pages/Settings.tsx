import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  getProfile,
  updateProfile,
} from "../services/auth.service";
import Header from "../components/Header";
import ConnectionBanner from "../components/ConnectionBanner";
import type { Profile } from "../types";
import { roleLabel } from "../utils/roles";

export default function Settings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUserId(user.id);

      try {
        const p = await getProfile(user.id);
        if (p) {
          setProfile(p);
          setDisplayName(p.display_name);
          const s = p.accessibility_settings ?? {};
          setLargeText(Boolean(s.large_text));
          setHighContrast(Boolean(s.high_contrast));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  // Apply accessibility settings live to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (largeText) root.classList.add("a11y-large-text");
    else root.classList.remove("a11y-large-text");
    if (highContrast) root.classList.add("a11y-high-contrast");
    else root.classList.remove("a11y-high-contrast");
  }, [largeText, highContrast]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const updated = await updateProfile(userId, {
        display_name: displayName.trim(),
        accessibility_settings: {
          large_text: largeText,
          high_contrast: highContrast,
        },
      });
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-600">
          Loading settings...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
          Settings
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Update your profile and accessibility preferences.
        </p>

        <ConnectionBanner className="mb-6" />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 mb-4">
            Saved.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-blue-900 mb-4">Profile</h3>

            <div className="space-y-4">
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
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {profile?.role && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Role
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2 inline-block">
                    {roleLabel(profile.role)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Role cannot be changed here. Contact your school
                    administrator if it needs to change.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Accessibility card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-bold text-blue-900 mb-1">
              Accessibility
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              These settings apply to all pages on this device.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={largeText}
                  onChange={(e) => setLargeText(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Larger text
                  </span>
                  <span className="block text-xs text-gray-500">
                    Increases base font size across the app.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="mt-1 w-4 h-4"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    High contrast
                  </span>
                  <span className="block text-xs text-gray-500">
                    Stronger colors for better readability in bright light.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-900 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 min-h-[48px]"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full mt-4 text-sm text-gray-600 hover:text-blue-900 py-2"
        >
          Back to dashboard
        </button>
      </main>
    </div>
  );
}