import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchPublicBusinesses,
  listAllCategories,
  getBusinessQrToken,
  hasAvailableStaff,
} from "../services/business.service";
import Header from "../components/Header";
import type { Business } from "../types";

interface CardState {
  business: Business;
  staffAvailable: boolean | null;
}

export default function PlacesDirectory() {
  const navigate = useNavigate();

  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  useEffect(() => {
    async function load() {
      try {
        const [biz, cats] = await Promise.all([
          searchPublicBusinesses({ limit: 100 }),
          listAllCategories(),
        ]);
        setAllBusinesses(biz);
        setCategories(cats);

        // Fetch availability for each in parallel (limit to first 30 for perf)
        const availMap: Record<string, boolean> = {};
        await Promise.all(
          biz.slice(0, 30).map(async (b) => {
            try {
              availMap[b.id] = await hasAvailableStaff(b.id);
            } catch {
              availMap[b.id] = false;
            }
          })
        );
        setAvailability(availMap);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not load the directory."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards: CardState[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allBusinesses
      .filter((b) => {
        if (category !== "All" && b.category !== category) return false;
        if (!q) return true;
        return (
          b.name.toLowerCase().includes(q) ||
          (b.category ?? "").toLowerCase().includes(q) ||
          (b.location ?? "").toLowerCase().includes(q)
        );
      })
      .map((b) => ({
        business: b,
        staffAvailable: availability[b.id] ?? null,
      }));
  }, [allBusinesses, query, category, availability]);

  async function openBusiness(businessId: string) {
    setError(null);
    setOpening(businessId);
    try {
      const token = await getBusinessQrToken(businessId);
      if (!token) {
        throw new Error("This business's communication link is not active.");
      }
      navigate(`/b/${token}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not open this business."
      );
      setOpening(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-6">
          <div className="text-xs font-semibold text-yellow-600 tracking-widest mb-1">
            FIND ACCESSIBLE PLACES
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
            Directory
          </h2>
          <p className="text-sm text-gray-600">
            Businesses and organisations that offer accessible communication.
          </p>
        </div>

        {/* Search + filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, category, or location"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading places…</p>
        ) : cards.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-600 mb-1">No places found.</p>
            <p className="text-sm text-gray-500">
              Try a different search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map(({ business: b, staffAvailable }) => (
              <button
                key={b.id}
                onClick={() => openBusiness(b.id)}
                disabled={opening === b.id}
                className="text-left bg-white rounded-lg shadow-sm hover:shadow-md transition p-5 border-l-4 border-green-700 disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-blue-900 text-lg leading-tight">
                    {b.name}
                  </h3>
                  {staffAvailable !== null && (
                    <span className="text-xs flex-shrink-0">
                      {staffAvailable ? "🟢" : "🔴"}
                    </span>
                  )}
                </div>
                {b.category && (
                  <p className="text-xs font-medium text-yellow-700 mb-1">
                    {b.category}
                  </p>
                )}
                {b.location && (
                  <p className="text-sm text-gray-600 mb-3">📍 {b.location}</p>
                )}
                {b.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {b.description}
                  </p>
                )}
                <span className="inline-block mt-3 text-xs text-blue-900 font-medium">
                  {opening === b.id ? "Opening…" : "Open →"}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}