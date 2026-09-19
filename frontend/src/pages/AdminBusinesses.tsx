import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkIsPlatformAdmin,
  listAllBusinesses,
  setBusinessActive,
} from "../services/admin.service";
import { useToast } from "../hooks/useToast";
import Header from "../components/Header";
import type { BusinessWithOwner } from "../services/admin.service";

export default function AdminBusinesses() {
  const navigate = useNavigate();
  const { push } = useToast();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessWithOwner[]>([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const ok = await checkIsPlatformAdmin();
      if (!ok) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setIsAdmin(true);
      await load();
      setChecking(false);
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function load() {
    try {
      const rows = await listAllBusinesses();
      setBusinesses(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    }
  }

  async function toggleActive(b: BusinessWithOwner) {
    setBusyId(b.id);
    try {
      await setBusinessActive(b.id, !b.is_active);
      push(b.is_active ? "Deactivated." : "Activated.", "success");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusyId(null);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-600">
          Checking access…
        </main>
      </div>
    );
  }
  if (!isAdmin) return null;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? businesses.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          (b.category ?? "").toLowerCase().includes(q) ||
          (b.location ?? "").toLowerCase().includes(q)
      )
    : businesses;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="text-sm text-gray-600 hover:text-blue-900 mb-2"
          >
            ← Admin Console
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">
            Businesses
          </h1>
          <p className="text-sm text-gray-600">
            {businesses.length} registered ·{" "}
            {businesses.filter((b) => b.is_active).length} active
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, category, or location"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">No businesses found.</p>
        ) : (
          <div className="bg-white shadow-sm rounded-lg divide-y">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-blue-900 truncate">
                    {b.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {b.category ?? "—"}
                    {b.location && ` · ${b.location}`}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Registered {new Date(b.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      b.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {b.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => toggleActive(b)}
                    disabled={busyId === b.id}
                    className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    {busyId === b.id
                      ? "…"
                      : b.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}