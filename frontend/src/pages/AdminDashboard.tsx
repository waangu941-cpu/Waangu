import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { checkIsPlatformAdmin } from "../services/admin.service";
import Header from "../components/Header";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function check() {
      const ok = await checkIsPlatformAdmin();
      if (!ok) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setIsAdmin(true);
      setChecking(false);
    }
    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-600">
          <div className="inline-block animate-pulse">
            <div className="text-4xl mb-2">🛡️</div>
            <p>Checking admin access…</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        {/* Header card */}
        <div className="bg-gradient-to-br from-gray-900 via-[#1e3a8a] to-[#1e40af] text-white rounded-xl shadow-md p-6 mb-8">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-[#eab308] mb-1">
            PLATFORM ADMIN
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">
            Admin Console
          </h1>
          <p className="text-sm text-blue-100">
            Manage verified content, moderate businesses, and view platform
            data.
          </p>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/admin/zsl"
            className="block text-left bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border-l-4 border-purple-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🤟</span>
              <h2 className="font-semibold text-blue-900 text-lg">
                ZSL Content
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              Review and verify Zambian Sign Language categories. Add video
              URLs after verification with Deaf partners.
            </p>
          </Link>

          <Link
            to="/admin/businesses"
            className="block text-left bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border-l-4 border-green-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🏪</span>
              <h2 className="font-semibold text-blue-900 text-lg">
                Businesses
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              View all registered businesses and toggle their active status.
            </p>
          </Link>

          <Link
            to="/admin/users"
            className="block text-left bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border-l-4 border-blue-900"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">👥</span>
              <h2 className="font-semibold text-blue-900 text-lg">Users</h2>
            </div>
            <p className="text-sm text-gray-600">
              Browse registered profiles and their roles.
            </p>
          </Link>

          <div className="text-left bg-white rounded-xl shadow-md p-5 border-l-4 border-gray-300 opacity-60">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <h2 className="font-semibold text-gray-700 text-lg">
                Analytics
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Coming later — session counts, QR scans, communication methods.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full mt-8 text-sm text-gray-600 hover:text-blue-900 py-2"
        >
          Back to dashboard
        </button>
      </main>
    </div>
  );
}