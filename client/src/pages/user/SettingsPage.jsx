import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import Toggle from "../../components/layout/Toggle";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";
import { useToast } from "../../components/layout/Toast";
import api from "../../services/api";
import appPackage from "../../../package.json";

const SettingsPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(true);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  const { theme, toggleTheme, isDark } = useTheme();
  const [showMobilePasswordModal, setShowMobilePasswordModal] = useState(false);
  const [showMobileDeleteModal, setShowMobileDeleteModal] = useState(false);
  const isGoogleAccount = Boolean(user?.authProvider === "google" || user?.googleId);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Manage devices state
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [revokingDevices, setRevokingDevices] = useState(false);
  const [showMobileDevicesModal, setShowMobileDevicesModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowMobilePasswordModal(false);
        setShowMobileDeleteModal(false);
        setShowMobileDevicesModal(false);
      }
    };
    if (showMobilePasswordModal || showMobileDeleteModal || showMobileDevicesModal) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [showMobilePasswordModal, showMobileDeleteModal, showMobileDevicesModal]);

  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem("token")) {
      navigate("/", { replace: true });
      return;
    }
    if (user) {
      fetchProfileData();
      fetchDevices();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, navigate]);

  const fetchProfileData = async () => {
    try {
      const response = await api.get("/api/user/profile");
      // API interceptor returns response.data directly, so response = { success: true, user: {...}, stats: {...} }
      const userData = response.user || response;
      setProfileData(userData);
    } catch (err) {
      addToast("Failed to load profile data", "error");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    setDevicesLoading(true);
    try {
      const response = await api.get("/api/user/devices");
      setDevices(response.devices || []);
    } catch (err) {
      console.error("Failed to load devices:", err);
    } finally {
      setDevicesLoading(false);
    }
  };

  const handleRevokeOtherDevices = async () => {
    setRevokingDevices(true);
    try {
      await api.post("/api/user/devices/revoke-others");
      addToast("Signed out of all other devices", "success");
      await fetchDevices();
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to sign out other devices", "error");
    } finally {
      setRevokingDevices(false);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    if (diffInMinutes < 2) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (password.length > 128) {
      errors.push("Password must be less than 128 characters");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    return errors;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Clear previous errors
    const errors = [];

    // Validate current password
    if (!passwordForm.currentPassword.trim()) {
      errors.push("Current password is required");
    }

    // Validate new password
    if (!passwordForm.newPassword.trim()) {
      errors.push("New password is required");
    } else {
      const passwordErrors = validatePassword(passwordForm.newPassword);
      errors.push(...passwordErrors);
    }

    // Validate confirm password
    if (!passwordForm.confirmNewPassword.trim()) {
      errors.push("Please confirm your new password");
    } else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      errors.push("New passwords do not match");
    }

    // Check if new password is same as current
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.push("New password must be different from current password");
    }

    // Display validation errors
    if (errors.length > 0) {
      addToast(errors[0], "error"); // Show first error
      return;
    }

    setPasswordLoading(true);

    try {
      await api.put("/api/user/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      addToast("Password changed successfully!", "success");
    } catch (err) {
      addToast(
        err.response?.data?.error || "Failed to change password",
        "error",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      addToast(
        "Please enter your password to confirm account deletion",
        "error",
      );
      return;
    }

    setDeleteLoading(true);

    try {
      await api.delete("/api/user/account", {
        data: { password: deletePassword },
      });

      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      addToast(
        err.response?.data?.error || "Failed to delete account",
        "error",
      );
      setDeleteLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      await api.post("/api/user/refresh-token");
      addToast("Token refreshed successfully!", "success");
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to refresh token", "error");
    }
  };

  if (!isAuthenticated || !user || !localStorage.getItem("token")) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <PageLoading message="Loading your settings..." />;
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE SETTINGS VIEW (block md:hidden) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden w-full max-w-lg mx-auto overflow-x-hidden px-4 pt-3 pb-24 animate-fadeIn">
        {/* Single Header: Back button + Title (No redundant title) */}
        <div className="flex items-center gap-3 mb-5 pt-1">
          <button
            type="button"
            onClick={() => navigate("/user/profile")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border theme-surface theme-text shadow-sm hover:bg-accent-50/60 active:scale-95 transition-all"
            aria-label="Back to Profile"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold theme-text">Settings</h1>
        </div>

        {/* ── SECTION 1: ACCOUNT ── */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider font-bold theme-muted mb-2 px-1">
            Account
          </div>
          <div className="rounded-2xl border border-border theme-surface p-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              {isGoogleAccount ? (
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold theme-text">
                  {isGoogleAccount ? "Google Account" : "Email & Password"}
                </div>
                <div className="text-xs theme-muted mt-0.5 leading-relaxed">
                  {isGoogleAccount
                    ? "Signed in with Google. Password is managed by your Google account."
                    : `Signed in as ${user?.email || "user"}.`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: PREFERENCES ── */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider font-bold theme-muted mb-2 px-1">
            Preferences
          </div>
          <div className="rounded-2xl border border-border theme-surface p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold theme-text">Dark Mode</div>
                  <div className="text-xs theme-muted truncate">
                    {isDark ? "Using dark theme" : "Use dark theme"}
                  </div>
                </div>
              </div>

              <Toggle
                checked={isDark}
                onChange={toggleTheme}
                ariaLabel="Toggle dark mode"
                size="md"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 3: SECURITY (Change Password & Manage Devices) ── */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider font-bold theme-muted mb-2 px-1">
            Security
          </div>
          <div className="rounded-2xl border border-border theme-surface p-2 space-y-1 shadow-xs">
            <button
              type="button"
              onClick={() => setShowMobilePasswordModal(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold theme-text">Change Password</div>
                  <div className="text-xs theme-muted">
                    {isGoogleAccount ? "Managed by Google Account" : "Update your account password"}
                  </div>
                </div>
              </div>
              <svg className="w-4 h-4 theme-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setShowMobileDevicesModal(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold theme-text">Manage Devices</div>
                  <div className="text-xs theme-muted">Active sessions and sign out</div>
                </div>
              </div>
              <svg className="w-4 h-4 theme-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── SECTION 4: LEGAL & SUPPORT (No harsh horizontal divider lines) ── */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-wider font-bold theme-muted mb-2 px-1">
            Legal & Support
          </div>
          <div className="rounded-2xl border border-border theme-surface p-2 space-y-1 shadow-xs">
            <Link
              to="/privacy"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold theme-text">Privacy & Terms</div>
                  <div className="text-xs theme-muted">Read our privacy policy and terms of service</div>
                </div>
              </div>
              <svg className="w-4 h-4 theme-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/help"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                    <circle cx="12" cy="17" r="0.75" fill="currentColor" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold theme-text">Help & Support</div>
                  <div className="text-xs theme-muted">Get help or contact us</div>
                </div>
              </div>
              <svg className="w-4 h-4 theme-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              to="/about"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
                    <line x1="12" y1="8" x2="12" y2="8" strokeWidth={2.2} strokeLinecap="round" />
                    <line x1="12" y1="12" x2="12" y2="16" strokeWidth={1.8} strokeLinecap="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold theme-text">About VoteBooth</div>
                  <div className="text-xs theme-muted">App version, features and credits</div>
                </div>
              </div>
              <svg className="w-4 h-4 theme-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── SECTION 5: DELETE ACCOUNT (DANGER ZONE) - Normal text on solid red background ── */}
        <div
          onClick={() => setShowMobileDeleteModal(true)}
          className="rounded-2xl bg-red-600 hover:bg-red-700 text-white p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setShowMobileDeleteModal(true);
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">
                Delete Account
              </div>
              <div className="text-xs text-white/80 mt-0.5">
                Permanently delete your account and all data
              </div>
            </div>
          </div>

          <svg className="w-4 h-4 text-white/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* App Version at the very end from package.json */}
        <div className="text-center text-xs theme-muted pt-6 pb-2">
          VoteBooth v{appPackage?.version || "2.6.5"}
        </div>

        {/* Manage Devices Sheet (Mobile) */}
        {showMobileDevicesModal && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
              onClick={() => setShowMobileDevicesModal(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 bottom-0 z-[101] max-w-lg mx-auto rounded-t-[32px] theme-surface border-t border-border shadow-2xl p-5 pb-8 animate-slideIn max-h-[85vh] overflow-y-auto">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold theme-text">Manage Devices</h2>
                <button
                  type="button"
                  onClick={() => setShowMobileDevicesModal(false)}
                  className="p-1 rounded-lg text-muted hover:theme-text"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs theme-muted mb-4 leading-relaxed">
                Devices currently signed in to your VoteBooth account.
              </p>

              {devicesLoading ? (
                <div className="py-8 text-center text-xs theme-muted">Loading active sessions...</div>
              ) : (
                <div className="space-y-2.5">
                  {devices.map((device) => {
                    const isMobile = device.deviceType === "mobile";
                    const isTablet = device.deviceType === "tablet";
                    return (
                      <div
                        key={device.sessionId}
                        className="p-3.5 rounded-2xl border border-border theme-surface flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            {isMobile ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : isTablet ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold theme-text truncate">
                              {device.browser} on {device.os}
                            </div>
                            <div className="text-xs theme-muted mt-0.5">
                              {device.isCurrent ? "Active now" : `Last active ${formatRelativeTime(device.lastActive)}`}
                            </div>
                          </div>
                        </div>

                        {device.isCurrent && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            This device
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {devices.filter((d) => !d.isCurrent).length > 0 ? (
                    <button
                      type="button"
                      disabled={revokingDevices}
                      onClick={handleRevokeOtherDevices}
                      className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>{revokingDevices ? "Signing out..." : "Sign out of all other devices"}</span>
                    </button>
                  ) : (
                    <div className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/15 text-center text-xs theme-muted">
                      You are currently only signed in on this device.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowMobileDevicesModal(false)}
                    className="w-full py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border theme-text font-semibold text-sm hover:bg-black/10 active:scale-[0.98] transition-all text-center block mt-2"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Change Password Sheet (Mobile) */}
        {showMobilePasswordModal && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
              onClick={() => setShowMobilePasswordModal(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 bottom-0 z-[101] max-w-lg mx-auto rounded-t-[32px] theme-surface border-t border-border shadow-2xl p-5 pb-8 animate-slideIn">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
              <h2 className="text-lg font-bold theme-text mb-4">Change Password</h2>

              {isGoogleAccount ? (
                <div className="text-center py-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-7 h-7" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold theme-text mb-1.5">Google Account Password</h3>
                  <p className="text-xs theme-muted mb-5 leading-relaxed px-2">
                    Your VoteBooth account is authenticated via Google. Your password and security keys are managed through Google Account settings.
                  </p>
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-medium text-sm shadow-md block text-center mb-3 active:scale-[0.98] transition-all"
                  >
                    Open Google Security Settings
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowMobilePasswordModal(false)}
                    className="w-full py-2.5 text-center text-sm theme-muted hover:theme-text font-semibold active:scale-[0.98] transition-all"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold theme-text mb-1 block">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold theme-text mb-1 block">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={8}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold theme-text mb-1 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                    required
                    minLength={8}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md mt-2 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {passwordLoading ? "Changing Password..." : "Update Password"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowMobilePasswordModal(false)}
                  className="w-full py-2.5 text-center text-sm theme-muted hover:theme-text font-semibold active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              </form>
              )}
            </div>
          </div>
        )}

        {/* Delete Account Sheet (Mobile) */}
        {showMobileDeleteModal && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
              onClick={() => setShowMobileDeleteModal(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 bottom-0 z-[101] max-w-lg mx-auto rounded-t-[32px] theme-surface border-t border-border shadow-2xl p-6 pb-8 animate-slideIn text-center">
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-500 mx-auto mb-3 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h2 className="text-xl font-bold theme-text mb-1.5">Delete Account?</h2>
              <p className="text-xs theme-muted mb-5 max-w-xs mx-auto leading-relaxed">
                This action is permanent and cannot be undone. All your booths, cast votes, and data will be permanently deleted.
              </p>

              <form onSubmit={handleDeleteAccount} className="space-y-3.5 text-left">
                {!isGoogleAccount && (
                  <div>
                    <label className="text-xs font-bold theme-text mb-1 block">
                      Enter your password to confirm
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      required
                      placeholder="Account password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting Account..." : "Yes, Delete My Account"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowMobileDeleteModal(false)}
                  className="w-full py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-border theme-text font-semibold text-sm hover:bg-black/10 active:scale-[0.98] transition-all text-center block"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── DESKTOP VIEW ONLY (hidden md:block) Untouched Desktop ─── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
<div className="min-h-screen theme-bg py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 relative overflow-hidden">
      {/* Floating orbs decoration */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none float">
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-20"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary), var(--color-accent))",
          }}
        />
      </div>
      <div
        className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 pointer-events-none float"
        style={{ "--stagger-index": 1 }}
      >
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent), var(--color-secondary))",
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold theme-text mb-2 sm:mb-4 animate-fadeIn">
              <span className="text-gradient">Account Settings</span>
            </h1>
            <p className="theme-muted text-sm sm:text-base animate-fadeIn">
              Manage your account security and preferences
            </p>
          </div>
        </div>

        <div className="space-y-6 animate-fadeIn stagger-children">
          {/* Account Information Card */}
          <div className="glass-card rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-xl card-hover" style={{"--stagger-index": 0}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-accent"
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
              </div>
              <h2 className="text-xl font-bold theme-text">
                Account Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="glass-card rounded-lg p-3 border border-border">
                <div className="font-medium theme-muted">Name</div>
                <div className="theme-text font-semibold">
                  {profileData?.name || "Not set"}
                </div>
              </div>
              <div className="glass-card rounded-lg p-3 border border-border">
                <div className="font-medium theme-muted">Email</div>
                <div className="theme-text font-semibold">
                  {profileData?.email || "Not set"}
                </div>
              </div>

              <div className="glass-card rounded-lg p-3 border border-border">
                <div className="font-medium theme-muted">Last Login</div>
                <div className="theme-text font-semibold">
                  {profileData?.lastLogin
                    ? new Date(profileData.lastLogin).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "Never"}
                </div>
              </div>
              <div className="glass-card rounded-lg p-3 border border-border">
                <div className="font-medium theme-muted">Account Type</div>
                <div className="theme-text font-semibold capitalize">
                  {profileData?.authProvider || "Local"}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card - Always visible */}
          <div className="glass-card rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-xl card-hover" style={{"--stagger-index": 1}}>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setPasswordOpen((prev) => !prev)}
                  aria-expanded={passwordOpen}
                  className="flex items-center gap-3 focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold theme-text">
                    Change Password
                  </h2>
                </button>
                <button
                  onClick={() => setPasswordOpen((prev) => !prev)}
                  aria-label={
                    passwordOpen
                      ? "Collapse password section"
                      : "Expand password section"
                  }
                  className="p-2 rounded-lg glass-card hover:bg-accent/5 transition-colors"
                >
                  <svg
                    className={`w-5 h-5 theme-text transform transition-transform ${passwordOpen ? "rotate-180" : "rotate-0"}`}
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
              </div>

              {passwordOpen && (
                <>
                  {isGoogleAccount ? (
                    <div className="p-4 rounded-xl glass-card border border-info/20 text-sm theme-text bg-info/5 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold mb-1">Managed by Google Account</div>
                        <p className="text-xs theme-muted">
                          You are signed in using Google. Password changes and 2-step verification are managed via your Google account.
                        </p>
                      </div>
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl btn-theme text-on-primary text-xs font-medium shrink-0"
                      >
                        Manage Google Password
                      </a>
                    </div>
                  ) : (
                  <>
                  <div className="mb-4 p-4 rounded-xl glass-card border border-info/20 text-sm theme-text bg-info/5">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-info flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        Keep your account secure by using a strong password with
                        at least 8 characters, including uppercase, lowercase,
                        and numbers.
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium theme-text mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 glass-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 theme-text"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium theme-text mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPasswordForm((prev) => ({
                              ...prev,
                              newPassword: value,
                            }));
                            // Update password requirements visual feedback
                            setPasswordRequirements({
                              length: value.length >= 8,
                              uppercase: /(?=.*[A-Z])/.test(value),
                              lowercase: /(?=.*[a-z])/.test(value),
                              number: /(?=.*\d)/.test(value),
                            });
                          }}
                          className="w-full px-4 py-2.5 glass-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 theme-text"
                          minLength={8}
                          required
                        />
                        {passwordForm.newPassword && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Password requirements:
                            </p>
                            <div className="flex items-center space-x-4 text-xs">
                              <div className="flex items-center space-x-1">
                                {passwordRequirements.length ? (
                                  <svg
                                    className="w-3 h-3 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-3 h-3 text-red-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                <span
                                  className={
                                    passwordRequirements.length
                                      ? "text-green-600"
                                      : "text-red-500"
                                  }
                                  title="At least 8 characters"
                                >
                                  8+ chars
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {passwordRequirements.uppercase ? (
                                  <svg
                                    className="w-3 h-3 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-3 h-3 text-red-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                <span
                                  className={
                                    passwordRequirements.uppercase
                                      ? "text-green-600"
                                      : "text-red-500"
                                  }
                                  title="Uppercase letter"
                                >
                                  A-Z
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {passwordRequirements.lowercase ? (
                                  <svg
                                    className="w-3 h-3 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-3 h-3 text-red-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                <span
                                  className={
                                    passwordRequirements.lowercase
                                      ? "text-green-600"
                                      : "text-red-500"
                                  }
                                  title="Lowercase letter"
                                >
                                  a-z
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {passwordRequirements.number ? (
                                  <svg
                                    className="w-3 h-3 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-3 h-3 text-red-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                <span
                                  className={
                                    passwordRequirements.number
                                      ? "text-green-600"
                                      : "text-red-500"
                                  }
                                  title="Number"
                                >
                                  0-9
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium theme-text mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.confirmNewPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirmNewPassword: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 glass-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 theme-text"
                          minLength={8}
                          required
                        />
                        {passwordForm.confirmNewPassword && (
                          <div className="mt-1 flex items-center space-x-2">
                            {passwordForm.newPassword ===
                            passwordForm.confirmNewPassword ? (
                              <>
                                <svg
                                  className="w-3 h-3 text-green-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-xs text-green-600">
                                  Passwords match
                                </span>
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-3 h-3 text-red-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-xs text-red-500">
                                  Passwords don't match
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <LoadingButton
                        type="submit"
                        loading={passwordLoading}
                        variant="teal"
                        className="px-6 py-2"
                      >
                        Update Password
                      </LoadingButton>
                    </div>
                  </form>
                  </>)}
                </>
              )}
            </div>

          {/* Google Account Notice */}
          {profileData?.authProvider === "google" && (
            <div className="glass-card rounded-xl border border-info/20 p-5 bg-info/5">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-info"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium theme-text">
                    Google Account
                  </h3>
                  <p className="mt-1 text-sm theme-muted">
                    You're signed in with Google. Password changes are managed
                    through your Google account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Actions Card */}
          <div className="glass-card rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-xl card-hover" style={{"--stagger-index": 2}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold theme-text">Security</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
                <div>
                  <h3 className="text-sm font-medium theme-text">
                    Refresh Authentication Token
                  </h3>
                  <p className="text-xs theme-muted mt-1">
                    Generate a new authentication token for enhanced security
                  </p>
                </div>
                <button
                  onClick={handleRefreshToken}
                  className="px-4 py-2 glass-card border border-border theme-text rounded-lg hover:bg-accent/5 transition-all duration-200 text-sm font-medium"
                >
                  Refresh Token
                </button>
              </div>

              <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
                <div>
                  <h3 className="text-sm font-medium theme-text">
                    Last Password Change
                  </h3>
                  <p className="text-xs theme-muted mt-1">
                    {profileData?.passwordChangedAt
                      ? new Date(
                          profileData.passwordChangedAt,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Never changed"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
                <div>
                  <h3 className="text-sm font-medium theme-text">
                    Login Attempts
                  </h3>
                  <p className="text-xs theme-muted mt-1">
                    Recent failed login attempts:{" "}
                    <span className="font-semibold">
                      {profileData?.loginAttempts || 0}
                    </span>
                  </p>
                </div>
              </div>

              {/* Manage Devices (Desktop) */}
              <div className="p-5 glass-card rounded-xl border border-border mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold theme-text">
                      Manage Devices & Sessions
                    </h3>
                    <p className="text-xs theme-muted mt-0.5">
                      Devices currently signed in to your VoteBooth account
                    </p>
                  </div>
                  {devices.filter((d) => !d.isCurrent).length > 0 && (
                    <button
                      type="button"
                      disabled={revokingDevices}
                      onClick={handleRevokeOtherDevices}
                      className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 text-red-600 dark:text-red-400 font-bold text-xs transition-all disabled:opacity-50"
                    >
                      {revokingDevices ? "Signing out..." : "Sign out of all other devices"}
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {devices.map((device) => (
                    <div
                      key={device.sessionId}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 theme-surface"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                          {device.deviceType === "mobile" ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold theme-text">
                            {device.browser} on {device.os}
                          </div>
                          <div className="text-xs theme-muted">
                            {device.isCurrent ? "Active now" : `Last active ${formatRelativeTime(device.lastActive)}`}
                          </div>
                        </div>
                      </div>

                      {device.isCurrent ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          This device
                        </span>
                      ) : (
                        <span className="text-xs theme-muted">Active session</span>
                      )}
                    </div>
                  ))}
                  {devices.length === 0 && (
                    <div className="text-xs theme-muted py-2">No other active devices.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Email Notifications Card */}
          <div className="glass-card rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-xl card-hover" style={{"--stagger-index": 3}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold theme-text">Email Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
                <div className="flex-1">
                  <h3 className="text-sm font-medium theme-text">Booth Activity</h3>
                  <p className="text-xs theme-muted mt-1">
                    Receive emails when someone joins your booth or when voting starts/ends
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
                <div className="flex-1">
                  <h3 className="text-sm font-medium theme-text">Voting Reminders</h3>
                  <p className="text-xs theme-muted mt-1">
                    Get reminded when you haven't voted in an active booth
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
                <div className="flex-1">
                  <h3 className="text-sm font-medium theme-text">Security Alerts</h3>
                  <p className="text-xs theme-muted mt-1">
                    Important notifications about your account security (always enabled)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed ml-4 opacity-50">
                  <input type="checkbox" className="sr-only peer" checked disabled />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Settings Card */}
          <div className="glass-card rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-xl card-hover" style={{"--stagger-index": 4}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold theme-text">Privacy & Data</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
                <div className="flex-1">
                  <h3 className="text-sm font-medium theme-text">Profile Visibility</h3>
                  <p className="text-xs theme-muted mt-1">
                    Allow other booth members to see your profile information
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-border">
                <div>
                  <h3 className="text-sm font-medium theme-text">Export Your Data</h3>
                  <p className="text-xs theme-muted mt-1">
                    Download all your data including booths, votes, and profile information
                  </p>
                </div>
                <button className="px-4 py-2 glass-card border border-border theme-text rounded-lg hover:bg-accent/5 transition-all duration-200 text-sm font-medium ml-4 whitespace-nowrap">
                  Download
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-card rounded-2xl border-l-4 border-error p-6 transition-all duration-300 hover:shadow-xl card-hover" style={{"--stagger-index": 5}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-error">Danger Zone</h2>
            </div>

            <div className="flex items-center justify-between p-4 glass-card rounded-xl border border-error/20 bg-error/5">
              <div>
                <h3 className="text-sm font-medium theme-text">
                  Delete Account
                </h3>
                <p className="text-xs theme-muted mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="glass-card rounded-2xl border border-border max-w-md w-full animate-slideUp">
              <div className="px-6 py-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-error"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-error">
                    Delete Account
                  </h3>
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="mb-4 p-4 rounded-xl glass-card border border-warning/20 bg-warning/5">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm theme-text">
                      This action cannot be undone. This will permanently delete
                      your account and remove all associated data.
                    </p>
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-medium theme-text mb-2">
                    Confirm your password to continue:
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-2.5 glass-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-error focus:border-error theme-text"
                    placeholder="Enter your password"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                    }}
                    className="px-4 py-2 glass-card border border-border theme-text rounded-lg hover:bg-accent/5 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    onClick={handleDeleteAccount}
                    loading={deleteLoading}
                    className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Delete Account
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
      </div>
    </>
  );
};

export default SettingsPage;
