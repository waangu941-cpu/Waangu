import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listZslResources, type ZslResource } from "../services/zsl.service";
import Header from "../components/Header";

export default function LearnZsl() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<ZslResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await listZslResources();
        setResources(rows);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not load content."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const verifiedCount = resources.filter(
    (r) => r.verification_status === "verified"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout />
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-6">
          <div className="text-xs font-semibold text-yellow-600 tracking-widest mb-1">
            LEARN ZAMBIAN SIGN LANGUAGE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
            Learn ZSL
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Categories of everyday signs. Content is added only after it has
            been reviewed with Deaf Zambian signers and interpreters.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1 text-xs text-yellow-800 font-medium">
            <span>🛡️</span>
            <span>
              {verifiedCount === 0
                ? "All content is pending verification"
                : `${verifiedCount} verified · all others pending`}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Loading categories…</p>
        ) : resources.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No categories yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r) => {
              const isVerified = r.verification_status === "verified";
              const isInReview = r.verification_status === "in_review";

              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${
                    isVerified
                      ? "border-green-700"
                      : isInReview
                      ? "border-yellow-400"
                      : "border-gray-300"
                  }`}
                >
                  {/* Placeholder thumbnail */}
                  <div className="bg-gradient-to-br from-blue-900 to-green-700 aspect-video flex items-center justify-center text-white">
                    <div className="text-center px-4">
                      <div className="text-3xl mb-1">🤟</div>
                      <p className="text-xs opacity-80">
                        {isVerified ? "Sign video" : "Video coming soon"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-xs font-semibold text-yellow-700 tracking-widest mb-1">
                      {r.category.toUpperCase()}
                    </p>
                    <h3 className="font-semibold text-blue-900 mb-1 leading-snug">
                      {r.label}
                    </h3>
                    {r.description && (
                      <p className="text-xs text-gray-500 mb-2">
                        {r.description}
                      </p>
                    )}

                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isVerified
                          ? "bg-green-100 text-green-800"
                          : isInReview
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isVerified ? (
                        <>
                          <span>✅</span>
                          <span>Verified</span>
                        </>
                      ) : isInReview ? (
                        <>
                          <span>🕓</span>
                          <span>In review</span>
                        </>
                      ) : (
                        <>
                          <span>⏳</span>
                          <span>Content to be verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <p className="font-medium mb-1">Why placeholders?</p>
          <p>
            Zambian Sign Language content must be verified with Deaf Zambian
            signers and interpreters. We do not publish unverified signs.
            Categories below are the plan — videos are added only after
            verification.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full mt-6 text-sm text-gray-600 hover:text-blue-900 py-2"
        >
          Back to dashboard
        </button>
      </main>
    </div>
  );
}