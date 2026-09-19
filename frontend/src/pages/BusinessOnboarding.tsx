import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth.service";
import { createBusiness } from "../services/business.service";
import Header from "../components/Header";
import QRCodeCard from "../components/QRCodeCard";

const CATEGORIES = [
  "Hospital",
  "Clinic",
  "Pharmacy",
  "Bank",
  "Electronics",
  "Grocery",
  "Restaurant",
  "Hotel",
  "Clothing",
  "Services",
  "Education",
  "Government Office",
  "Police Station",
  "Church",
  "Mosque",
  "Temple",
  "Community Organisation",
  "NGO",
  "Other",
];

export default function BusinessOnboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdBusiness, setCreatedBusiness] = useState<{
    id: string;
    name: string;
    token: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const finalCategory =
        category === "Other" && customCategory.trim()
          ? customCategory.trim()
          : category;

      const result = await createBusiness({
        owner_id: user.id,
        name,
        category: finalCategory,
        location,
        description,
      });

      setCreatedBusiness({
        id: result.id,
        name: result.name,
        token: result.public_token,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create business."
      );
    } finally {
      setLoading(false);
    }
  }

  if (createdBusiness) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showLogout />
        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-blue-900 mb-2">
              Your communication QR is ready
            </h2>
            <p className="text-gray-600 mb-8">
              Print this and place it where customers can see it. Anyone who
              scans it can start a secure conversation with your staff.
            </p>

            <QRCodeCard
              businessName={createdBusiness.name}
              publicToken={createdBusiness.token}
            />

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(`/business/${createdBusiness.id}`)}
                className="bg-blue-900 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-800 transition"
              >
                Go to Business Dashboard
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="text-blue-900 px-6 py-3 rounded-md font-medium border border-gray-300 hover:bg-gray-50 transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-md mx-auto px-4 py-8 sm:py-12 pb-16">
        <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-1">
            Register your business
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Get a permanent QR code that customers can scan to communicate
            accessibly with your staff.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. ABC Electronics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {category === "Other" && (
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type your category"
                  className="w-full mt-2 border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Lusaka"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What does your business do?"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white py-3 rounded-md font-medium hover:bg-blue-800 transition disabled:opacity-50 min-h-[48px]"
            >
              {loading ? "Creating..." : "Create business & generate QR"}
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