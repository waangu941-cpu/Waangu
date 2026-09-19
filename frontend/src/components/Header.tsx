import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "../services/auth.service";
import { checkIsPlatformAdmin } from "../services/admin.service";
import Logo from "./Logo";

interface HeaderProps {
  showLogout?: boolean;
  userEmail?: string;
}

function initialsFromEmail(email?: string): string {
  if (!email) return "?";
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Header({ showLogout, userEmail }: HeaderProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close menu on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Check admin status once we're logged in
  useEffect(() => {
    if (!showLogout) {
      setIsAdmin(false);
      return;
    }
    let mounted = true;
    checkIsPlatformAdmin()
      .then((ok) => {
        if (mounted) setIsAdmin(ok);
      })
      .catch(() => {
        if (mounted) setIsAdmin(false);
      });
    return () => {
      mounted = false;
    };
  }, [showLogout]);

  async function handleLogout() {
    setMenuOpen(false);
    try {
      await signOut();
    } catch {
      // ignore
    }
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#1e3a8a] via-[#1e40af] to-[#15803d] text-white shadow-md">
      {/* Yellow accent line */}
      <div className="h-1 bg-[#eab308]" />

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link
          to="/dashboard"
          className="flex items-center gap-3 min-w-0"
          aria-label="EduMarket Zambia home"
        >
          <div className="w-11 h-11 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Logo className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold leading-tight truncate">
              EduMarket <span className="text-[#eab308]">Zambia</span>
            </h1>
            <p className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] text-[#eab308]">
              LEARN • TEACH • CONNECT
            </p>
          </div>
        </Link>

        {/* Right side */}
        {showLogout ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tagline on wider screens */}
            <p className="hidden lg:block text-xs text-blue-100 italic max-w-[220px] text-right leading-tight">
              Inclusive communication for a brighter future
            </p>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 pl-1 pr-2 sm:pr-3 py-1 transition"
              >
                <span className="w-8 h-8 rounded-full bg-[#eab308] text-blue-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {initialsFromEmail(userEmail)}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform hidden sm:block ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userEmail ?? "Unknown user"}
                    </p>
                  </div>

                  {/* Menu items */}
                  <nav className="py-1">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-50"
                      >
                        <span>🛡️</span>
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <Link
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span>🏠</span>
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      to="/places"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span>🏥</span>
                      <span>Find accessible places</span>
                    </Link>

                    <Link
                      to="/learn-zsl"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span>🤟</span>
                      <span>Learn Sign Language</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span>⚙️</span>
                      <span>Settings</span>
                    </Link>

                    <Link
                      to="/privacy"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span>🔒</span>
                      <span>Privacy Policy</span>
                    </Link>
                  </nav>

                  {/* Logout */}
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <span>🚪</span>
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-sm px-3 py-1.5 bg-[#eab308] text-blue-900 rounded-md font-medium hover:bg-yellow-300 transition"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}