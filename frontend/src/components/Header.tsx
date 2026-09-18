import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface HeaderProps {
  showLogout?: boolean;
  userEmail?: string;
}

export default function Header({ showLogout, userEmail }: HeaderProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <header className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-md flex items-center justify-center">
            <span className="text-blue-900 font-bold text-xl">E</span>
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">EduMarket Zambia</h1>
            <p className="text-xs text-yellow-300">Learn • Teach • Grow</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <p className="hidden sm:block text-sm text-blue-100">
            Inclusive Education for a Brighter Future
          </p>
          {showLogout && (
            <div className="flex items-center gap-3">
              {userEmail && (
                <span className="text-sm text-blue-100 hidden md:inline">
                  {userEmail}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 bg-yellow-400 text-blue-900 rounded-md font-medium hover:bg-yellow-300 transition"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}