import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

interface SessionRow {
  id: string;
  title: string;
  subject: string;
  join_code: string;
  status: string;
  started_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | undefined>();
  const [displayName, setDisplayName] = useState<string>("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate("/login");
        return;
      }
      setEmail(userData.user.email);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profile?.display_name) setDisplayName(profile.display_name);

      const { data: mySessions } = await supabase
        .from("sessions")
        .select("id, title, subject, join_code, status, started_at")
        .order("started_at", { ascending: false })
        .limit(10);

      if (mySessions) setSessions(mySessions);
    }
    load();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showLogout userEmail={email} />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-blue-900 mb-2">
          Welcome{displayName ? `, ${displayName}` : ""}
        </h2>
        <p className="text-gray-600 mb-8">
          Your inclusive communication dashboard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Create a session</h3>
            <p className="text-sm text-gray-600 mb-4">
              Teachers: start a new STEM communication session.
            </p>
            <button
              onClick={() => navigate("/create-session")}
              className="w-full bg-blue-900 text-white py-2 rounded-md font-medium hover:bg-blue-800 transition"
            >
              Create session
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Join a session</h3>
            <p className="text-sm text-gray-600 mb-4">
              Students: enter a code to join a teacher's session.
            </p>
            <button
              onClick={() => navigate("/join-session")}
              className="w-full bg-yellow-400 text-blue-900 py-2 rounded-md font-medium hover:bg-yellow-300 transition"
            >
              Join session
            </button>
          </div>
        </div>

        <h3 className="text-xl font-bold text-blue-900 mb-4">Your sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No sessions yet. Create one above to get started.
          </p>
        ) : (
          <div className="bg-white shadow-md rounded-lg divide-y">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/session/${s.id}`)}
                className="w-full text-left p-4 hover:bg-gray-50 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-blue-900">{s.title}</p>
                  <p className="text-sm text-gray-600">
                    {s.subject} • Code: <span className="font-mono">{s.join_code}</span>
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    s.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {s.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}