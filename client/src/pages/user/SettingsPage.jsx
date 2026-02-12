import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";
import { useToast } from "../../components/layout/Toast";
import BackButton from "../../components/layout/BackButton";
import api from "../../services/api";

const SettingsPage = () => {
  const { user, logout } = useAuth();
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

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

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

      logout();
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

  if (loading) {
    return <PageLoading message="Loading your settings..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center">
        <div className="glass-card rounded-2xl border border-border p-8">
          <h1 className="text-2xl font-bold theme-text mb-4">
            Authentication Required
          </h1>
          <p className="theme-muted">
            Please log in to access your account settings.
          </p>
        </div>
      </div>
    );
  }

  return (
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

          {/* Change Password Card */}
          {profileData?.authProvider !== "google" && (
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
                </>
              )}
            </div>
          )}

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
  );
};

export default SettingsPage;
