import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import packageJson from "../../../package.json";

// ── Service health banner ────────────────────────────────────────────────────
const ServiceBanner = () => {
  const [degraded, setDegraded] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    // Persist dismissal across refreshes
    return localStorage.getItem('health-banner-dismissed') === 'true';
  });
  const lastStatusRef = useRef(null); // Track last status to avoid duplicate logs
  const prevDegradedRef = useRef([]);

  const check = useCallback(async () => {
    try {
      const BASE = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${BASE}/api/health/services`, {
        credentials: "include",
      });
      
      // Try to parse JSON body even if the status is non-2xx (server uses 503 when services degraded)
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        // Only log if this is a new error state
        if (lastStatusRef.current !== 'parse-error') {
          console.warn(`Health check returned ${res.status} with non-JSON response`);
          lastStatusRef.current = 'parse-error';
        }
        return;
      }

      const down = (data.services || []).filter((s) => !s.ok);
      const currentStatus = down.length > 0 ? down.map(s => s.key).sort().join(',') : 'healthy';
      
      // Only log when status changes. Use generic messages to avoid
      // exposing service identifiers or labels in production logs.
      if (lastStatusRef.current !== currentStatus) {
        if (down.length > 0) {
          // Generic warning — do not include service names/labels
          console.warn('⚠️ Service health degraded: one or more services are unavailable');
        } else if (lastStatusRef.current !== null) {
          // Use info level for recovery to reduce severity in logs
          console.info('✅ All services recovered');
        }
        lastStatusRef.current = currentStatus;
      }
      
      // Only update degraded list and clear dismissal when a real recovery occurred
      const prev = prevDegradedRef.current || [];
      setDegraded(down);

      // If everything recovered now but there were degraded services before,
      // clear dismissal so banner can show again on future issues.
      if (down.length === 0 && prev.length > 0) {
        setDismissed(false);
        localStorage.removeItem('health-banner-dismissed');
      }

      // Save previous degraded list for next comparison
      prevDegradedRef.current = down;
    } catch (err) {
      // Only log network errors once
      if (lastStatusRef.current !== 'network-error') {
        console.warn('Health check endpoint unreachable');
        lastStatusRef.current = 'network-error';
      }
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [check]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('health-banner-dismissed', 'true');
  };

  if (dismissed || degraded.length === 0) return null;

  const names = degraded.map((s) => s.label).join(", ");

  return (
    <div
      role="alert"
      className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-3 text-sm"
    >
      <div className="flex items-center gap-2 text-amber-800">
        <svg
          className="w-4 h-4 flex-shrink-0 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
        <span>
          <strong>Some services are currently unavailable</strong> — {names}.
          Certain features may not work as expected.
        </span>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss warning"
        className="flex-shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // If neither the desktop menu nor the mobile menu contain the click, close menu
      const clickedInsideDesktop =
        menuRef.current && menuRef.current.contains(e.target);
      const clickedInsideMobile =
        mobileMenuRef.current && mobileMenuRef.current.contains(e.target);
      if (isMenuOpen && !clickedInsideDesktop && !clickedInsideMobile) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [isMenuOpen]);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/?message=logged_out");
  };

  const isActivePath = (path) => location.pathname === path;

  const publicNavItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/features", label: "Features" },
    { path: "/contact", label: "Contact" },
  ];

  const userNavItems = [{ path: "/dashboard", label: "Dashboard" }];

  return (
    <nav className="theme-surface shadow-sm border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <style>{`
              /* Hide username and slightly reduce avatar in the narrow mid breakpoint (767px - 840px)
                 This improves UX where space is limited between sm and md Tailwind breakpoints. */
              @media (min-width: 767px) and (max-width: 840px) {
                .hide-at-mid { display: none !important; }
                .nav-avatar { width: 28px !important; height: 28px !important; }
                .nav-avatar img { width: 28px !important; height: 28px !important; }
              }
            `}</style>
        <div className="flex items-center justify-between h-12 sm:h-16">
          {/* Logo - Mobile Optimized */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 btn-theme rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold theme-text">
                VoteBooth
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Wider viewports */}
          <div className="hidden md:block flex-1">
            <div className="flex items-center justify-between">
              {/* Left side - All nav items always visible */}
              <div className="ml-6 flex items-center space-x-4 lg:space-x-6">
                {publicNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium transition-all duration-300 rounded-md ${
                      isActivePath(item.path)
                        ? "text-accent bg-accent-50 border-l-4 border-accent"
                        : "theme-text theme-muted hover:text-accent hover:bg-accent-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Right side - Dashboard + Auth */}
              <div className="flex items-center space-x-2 lg:space-x-4">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Dashboard - only when authenticated */}
                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className={`flex items-center px-3 lg:px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                      isActivePath("/dashboard")
                        ? "btn-theme shadow-md"
                        : "theme-surface theme-text hover:btn-theme"
                    }`}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                )}

                {/* Auth buttons */}
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium theme-text hover:text-accent hover:bg-gray-50 rounded-lg transition-all duration-300"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 lg:px-6 py-1.5 lg:py-2 text-xs lg:text-sm font-medium btn-theme rounded-lg transition-all duration-300 shadow-md"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center space-x-2 px-2 py-1.5 theme-text hover:text-accent transition-colors rounded-md hover:bg-accent-50"
                    >
                      <div className="w-7 h-7 lg:w-9 lg:h-9 nav-avatar overflow-hidden rounded-full theme-surface flex items-center justify-center border border-border">
                        {user?.profile?.avatar || user?.profilePicture ? (
                          <img
                            src={user?.profile?.avatar || user?.profilePicture}
                            alt={`Avatar of ${user?.name || "user"}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="theme-text font-medium text-xs lg:text-sm">
                            {user?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span
                        className="font-medium text-xs lg:text-sm hidden sm:block max-w-[9rem] truncate hide-at-mid"
                        title={user?.name}
                      >
                        {user?.name ? user.name.split(" ")[0] : ""}
                      </span>
                      <svg
                        className="w-3 h-3 lg:w-4 lg:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 theme-surface rounded-xl shadow-lg border border-border py-1 z-50">
                        <Link
                          to="/user/profile"
                          className="block px-4 py-2 text-sm transition-all duration-300 rounded-md theme-text theme-muted hover:text-accent hover:bg-accent-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          to="/user/settings"
                          className="block px-4 py-2 text-sm transition-all duration-300 rounded-md theme-text theme-muted hover:text-accent hover:bg-accent-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <Link
                          to="/help"
                          className="block px-4 py-2 text-sm transition-all duration-300 rounded-md theme-text theme-muted hover:text-accent hover:bg-accent-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Help
                        </Link>
                        <div className="my-1">
                          <div className="h-px w-full rounded-full bg-theme-surface/20 backdrop-blur-sm" />
                        </div>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-error-50 transition-all duration-300 rounded-md"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button + Profile icon - Enhanced Design */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Theme Toggle for mobile */}
            <ThemeToggle />

            {/* Profile icon - only when authenticated */}
            {isAuthenticated && (
              <div className="w-8 h-8 nav-avatar overflow-hidden rounded-full theme-surface flex items-center justify-center border border-border">
                {user?.profile?.avatar || user?.profilePicture ? (
                  <img
                    src={user?.profile?.avatar || user?.profilePicture}
                    alt={`Avatar of ${user?.name || "user"}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="theme-text font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
            )}

            {/* Hamburger menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 theme-muted hover:text-accent hover:bg-accent-50 rounded-lg transition-colors focus:outline-none focus-ring"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Popup (full-screen, non-scrollable) */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            ></div>

            {/* Fullscreen Mobile Menu Panel - covers entire viewport and prevents scrolling */}
            <div
              ref={mobileMenuRef}
              className="fixed inset-0 theme-surface shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header - Improved Spacing */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border theme-surface">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 btn-theme rounded-lg flex items-center justify-center shadow-sm">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-base font-bold theme-text">
                      VoteBooth
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 theme-muted hover:text-accent hover:bg-accent-50 rounded-lg transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Navigation Links - enhanced spacing; content is fixed (no scroll) */}
                <div className="flex-1 py-4 px-4">
                  <div className="space-y-1 h-full">
                    {/* Always show public nav items */}
                    {publicNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                          isActivePath(item.path)
                            ? "text-accent bg-accent-50 border-l-4 border-accent shadow-sm"
                            : "theme-text theme-muted hover:text-accent hover:bg-gray-50"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}

                    {/* Auth Actions - Improved Design */}
                    {!isAuthenticated && (
                      <div className="pt-4 mt-4 border-t border-gray-100">
                        <div className="space-y-3">
                          <Link
                            to="/login"
                            className="flex items-center justify-center w-full px-4 py-3 text-base font-medium theme-text theme-surface rounded-xl border border-border transition-all duration-200 shadow-sm"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg
                              className="w-5 h-5 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Sign In
                          </Link>
                          <Link
                            to="/register"
                            className="flex items-center justify-center w-full px-4 py-3 text-base font-medium btn-theme rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg
                              className="w-5 h-5 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                              />
                            </svg>
                            Sign Up
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Dashboard + User Settings for Authenticated Users */}
                    {isAuthenticated && (
                      <>
                        <div className="border-t border-gray-200 my-4 pt-4">
                          {/* Dashboard with unique styling */}
                          <Link
                            to="/dashboard"
                            className={`flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-200 mb-3 ${
                              isActivePath("/dashboard")
                                ? "btn-theme text-on-primary shadow-md border-0"
                                : "theme-surface theme-text hover:btn-theme"
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg
                              className="w-5 h-5 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"
                              />
                            </svg>
                            Dashboard
                          </Link>
                        </div>

                        <Link
                          to="/user/profile"
                          className="flex items-center px-4 py-4 text-base font-medium theme-text hover:text-accent hover:bg-accent-50 rounded-xl transition-all duration-200 mx-0 mb-1 focus:outline-none focus:ring-accent"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg
                            className="w-5 h-5 mr-3 theme-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Profile
                        </Link>

                        <Link
                          to="/user/settings"
                          className="flex items-center px-4 py-4 text-base font-medium theme-text hover:text-accent hover:bg-accent-50 rounded-xl transition-all duration-200 mx-0 mb-1 focus:outline-none focus:ring-accent"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg
                            className="w-5 h-5 mr-3 theme-muted"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Settings
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Actions - Enhanced Logout */}
                {isAuthenticated && (
                  <div className="border-t border-border p-4 theme-surface">
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-error hover:bg-error-50 rounded-xl border border-error transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-accent"
                    >
                      <svg
                        className="w-5 h-5 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className="theme-surface border-t border-border">
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-2">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 btn-theme rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-on-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold theme-text">VoteBooth</span>
            </div>
            <p className="theme-muted mb-2 sm:mb-3 max-w-md text-xs sm:text-sm leading-relaxed">
              Secure, transparent, and easy-to-use online voting platform for
              organizations, communities, and teams of all sizes.
            </p>
          </div>

          {/* Links */}
          <div className="mt-2 sm:mt-0">
            <h3 className="text-xs sm:text-sm font-semibold theme-text uppercase tracking-wider mb-2 sm:mb-3">
              Company
            </h3>
            <ul className="space-y-0.5 sm:space-y-1">
              <li>
                <Link
                  to="/about"
                  className="theme-muted hover:text-accent transition-colors text-xs sm:text-sm block py-0.5"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/features"
                  className="theme-muted hover:text-accent transition-colors text-xs sm:text-sm block py-0.5"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="theme-muted hover:text-accent transition-colors text-xs sm:text-sm block py-0.5"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-2 sm:mt-0">
            <h3 className="text-xs sm:text-sm font-semibold theme-text uppercase tracking-wider mb-2 sm:mb-3">
              Legal
            </h3>
            <ul className="space-y-0.5 sm:space-y-1">
              <li>
                <Link
                  to="/privacy"
                  className="theme-muted hover:text-accent transition-colors text-xs sm:text-sm block py-0.5"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="theme-muted hover:text-accent transition-colors text-xs sm:text-sm block py-0.5"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="theme-muted hover:text-accent transition-colors text-xs sm:text-sm block py-0.5"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border text-center">
          <p className="theme-muted text-xs sm:text-sm">
            © 2025 VoteBooth. All rights reserved. • <span className="inline-block ml-1 px-2 py-0.5 text-xs font-medium bg-accent-50 text-accent rounded-full">v{packageJson.version}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

const Layout = ({ children, showFooter = true }) => {
  const location = useLocation();
  const isAuthPage = [
    "/login",
    "/register",
    "/auth/check-email",
    "/auth/verify-email",
    "/auth/verification-error",
    "/forgot-password",
    "/reset-password",
  ].includes(location.pathname);

  if (isAuthPage) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <ServiceBanner />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
