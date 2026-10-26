import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "../../../components/icons/Icons";
import api from "../../../services/api";
import { Alert } from "../../../components/layout/Alert";
import AuthWatermarkBackground from "../../../components/layout/AuthWatermarkBackground";

export default function ResetPasswordPage() {
  // URL params and navigation
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const alertTimeoutRef = useRef(null);

  // Auto-dismiss non-token alerts after 8 seconds
  useEffect(() => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }

    if (error) {
      alertTimeoutRef.current = setTimeout(() => {
        setError("");
        alertTimeoutRef.current = null;
      }, 8000);
    }

    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }
    };
  }, [error]);

  // Password strength validation state
  const [validations, setValidations] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    passwordsMatch: false,
  });

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
      setTokenValid(false);
    }
  }, [token]);

  // Countdown for redirect after success
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate("/login", {
        state: {
          message:
            "Password reset successful! Please log in with your new password.",
          type: "success",
        },
      });
    }
  }, [success, countdown, navigate]);

  // Validate password in real-time
  useEffect(() => {
    setValidations({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0,
    });
  }, [password, confirmPassword]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate all requirements met
    const allValid = Object.values(validations).every((v) => v === true);
    if (!allValid) {
      setError("Please meet all password requirements before submitting.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/auth/reset-password", {
        token,
        password,
      });

      if (response.success) {
        setSuccess(true);
      }
    } catch (err) {
      let errorMsg;

      if (!err.response) {
        errorMsg =
          "Network error. Please check your internet connection and try again.";
      } else if (err.response.status === 400) {
        errorMsg =
          err.response?.data?.error ||
          "Invalid reset link. Please request a new password reset.";
        setTokenValid(false);
      } else if (err.response.status === 404) {
        errorMsg =
          "Reset link has expired or is invalid. Please request a new password reset.";
        setTokenValid(false);
      } else if (err.response.status >= 500) {
        errorMsg = "Server error. Please try again in a few moments.";
      } else {
        errorMsg =
          err.response?.data?.error ||
          "Failed to reset password. Please try again.";
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Show success message
  if (success) {
    return (
      <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Password Reset Success */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden w-full max-w-md mx-auto min-h-screen theme-bg relative px-5 pt-8 pb-10 flex flex-col justify-between overflow-x-hidden animate-fadeIn">
        <AuthWatermarkBackground />

        <div className="relative z-10 w-full text-center">
          {/* Success Checkmark Circle */}
          <div className="flex flex-col items-center justify-center mb-6 mt-8">
            <div className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center shadow-inner">
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold theme-text tracking-tight mb-2">
            Password Reset!
          </h1>
          <p className="text-xs theme-muted leading-relaxed px-4 mb-8">
            Your password has been changed successfully. You can now log in with your new password.
          </p>

          <Link
            to="/login"
            className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Continue to Sign In</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        <div className="relative z-10 text-center text-xs theme-muted">
          Redirecting in {countdown}s...
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── DESKTOP VIEW ONLY (hidden md:block) - Preserved Desktop ─── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block w-full">
      <div className="min-h-screen theme-bg flex items-center justify-center py-4 sm:py-8 px-4 relative overflow-hidden">
        {/* Floating orbs background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float"
            style={{ "--float-distance": "30px" }}
          ></div>
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float"
            style={{ "--float-distance": "-40px", "--float-duration": "8s" }}
          ></div>
        </div>

        <div className="max-w-md w-full relative z-10">
          <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-border animate-pop">
            {/* Success Icon */}
            <div className="flex justify-center mb-6 animate-fadeIn">
              <div className="glass-card p-4 rounded-2xl border-2 border-green-500/30">
                <svg
                  className="w-12 h-12 text-green-600 dark:text-green-400"
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
            </div>

            {/* Success Message */}
            <div className="text-center space-y-3 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold theme-text">
                Password Reset Successful!
              </h2>
              <p className="theme-muted text-base">
                Your password has been changed successfully. You can now log in
                with your new password.
              </p>
            </div>

            {/* Countdown Message */}
            <div className="glass-card border-2 border-accent/20 rounded-xl p-4 mb-6">
              <p className="text-sm theme-text text-center flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 text-accent" />
                Redirecting to login in{" "}
                <strong className="text-accent">{countdown}</strong> second
                {countdown !== 1 ? "s" : ""}...
              </p>
            </div>

            {/* Manual Navigation */}
            <Link
              to="/login"
              className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
      </div>
      </>
    );
  }

  // Show reset form
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Matching Screen 5 ──── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden w-full max-w-md mx-auto min-h-screen theme-bg relative px-5 pt-6 pb-10 flex flex-col justify-between overflow-x-hidden animate-fadeIn">
        <AuthWatermarkBackground />

        <div className="relative z-10 w-full">
          {/* Top Back Button */}
          <div className="flex items-center mb-4">
            <Link
              to="/login"
              className="w-10 h-10 rounded-2xl border border-border theme-surface flex items-center justify-center text-main shadow-xs active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          </div>

          {/* Central Padlock Illustration */}
          <div className="flex flex-col items-center justify-center mb-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/50 dark:border-cyan-800/50 flex items-center justify-center shadow-inner">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-cyan-400" />
              <div className="absolute bottom-2 -left-1 w-1.5 h-1.5 rounded-full bg-teal-400" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold theme-text tracking-tight mb-2">
              Create New Password
            </h1>
            <p className="text-xs theme-muted leading-relaxed px-4">
              Your new password must be different from previous ones.
            </p>
          </div>

          {!tokenValid ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-center">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">
                  Invalid or Expired Reset Link
                </p>
                <p className="text-[11px] theme-muted">
                  Reset links expire after 10 minutes for security reasons.
                </p>
              </div>

              <Link
                to="/forgot-password"
                className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Request New Reset Link</span>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4">
                  <Alert type="error" message={error} onClose={() => setError("")} />
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="text-xs font-bold theme-text mb-1 block">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:theme-text"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Checklist matching Screen 5 */}
                  <div className="grid grid-cols-2 gap-2 mt-2.5 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${validations.minLength ? "bg-emerald-500 text-white" : "border border-border text-transparent"}`}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className={`text-[11px] ${validations.minLength ? "theme-text font-medium" : "theme-muted"}`}>8+ characters</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${validations.hasUppercase ? "bg-emerald-500 text-white" : "border border-border text-transparent"}`}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className={`text-[11px] ${validations.hasUppercase ? "theme-text font-medium" : "theme-muted"}`}>One uppercase letter</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${validations.hasNumber ? "bg-emerald-500 text-white" : "border border-border text-transparent"}`}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className={`text-[11px] ${validations.hasNumber ? "theme-text font-medium" : "theme-muted"}`}>One number</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${validations.hasLowercase ? "bg-emerald-500 text-white" : "border border-border text-transparent"}`}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className={`text-[11px] ${validations.hasLowercase ? "theme-text font-medium" : "theme-muted"}`}>One lowercase letter</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-bold theme-text mb-1 block">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:theme-text"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Reset Password Button */}
                <button
                  type="submit"
                  disabled={loading || !validations.minLength || !validations.hasUppercase || !validations.hasLowercase || !validations.hasNumber || !validations.passwordsMatch}
                  className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Resetting password...</span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Reset Password</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer Link */}
        <div className="relative z-10 text-center pt-8 text-xs theme-muted">
          Remember your password?{" "}
          <Link to="/login" className="font-bold text-accent hover:underline">
            Sign in
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── DESKTOP VIEW ONLY (hidden md:block) - Preserved Desktop ─── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block w-full">
    <div className="min-h-screen theme-bg flex items-center justify-center py-4 sm:py-8 px-4 relative overflow-hidden">
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float"
          style={{ "--float-distance": "30px" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float"
          style={{ "--float-distance": "-40px", "--float-duration": "8s" }}
        ></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="flex justify-center mb-4">
            <div className="glass-card p-4 rounded-2xl interactive-scale border-2 border-accent/20">
              <Lock className="w-10 h-10 text-accent" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold theme-text mb-2">
            Reset Password
          </h1>
          <p className="text-base theme-muted">
            Create a strong password to secure your account
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-border animate-pop">
          {/* Token Invalid Warning */}
          {!tokenValid && (
            <Alert
              type="error"
              message={
                <div className="space-y-2">
                  <p className="font-semibold">Invalid or Expired Reset Link</p>
                  <p className="text-sm">
                    This password reset link is no longer valid. Reset links
                    expire after 10 minutes for security reasons.
                  </p>
                </div>
              }
              className="mb-5"
            />
          )}

          {error && tokenValid && (
            <Alert type="error" message={error} className="mb-5" />
          )}

          {/* Token Invalid State */}
          {!tokenValid ? (
            <div className="space-y-5">
              <div className="glass-card border-2 border-amber-500/20 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      What you can do:
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                      <li>Request a new password reset link</li>
                      <li>Check your email for the most recent link</li>
                      <li>
                        Make sure you're using the complete link from the email
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Link
                to="/forgot-password"
                className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Request New Reset Link
              </Link>

              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm theme-muted">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="text-accent hover:text-accent/80 font-semibold transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password Input */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium theme-text mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      disabled={!token}
                      className={`w-full px-4 py-3 pr-12 theme-surface border-2 rounded-xl focus:outline-none focus:ring-2 theme-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        password &&
                        Object.values(validations)
                          .slice(0, 4)
                          .every((v) => v)
                          ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                          : password
                            ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500/20"
                            : "border-border focus:ring-accent focus:border-accent"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted hover:text-accent transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium theme-text mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      disabled={!token}
                      className={`w-full px-4 py-3 pr-12 theme-surface border-2 rounded-xl focus:outline-none focus:ring-2 theme-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        confirmPassword && validations.passwordsMatch
                          ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                          : confirmPassword && !validations.passwordsMatch
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : "border-border focus:ring-accent focus:border-accent"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted hover:text-accent transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                {password && (
                  <div className="glass-card border-2 border-border rounded-xl p-4 space-y-2">
                    <p className="text-sm font-medium theme-text mb-3">
                      Password Requirements:
                    </p>
                    <div className="space-y-1.5">
                      <RequirementItem
                        met={validations.minLength}
                        text="At least 8 characters"
                      />
                      <RequirementItem
                        met={validations.hasUppercase}
                        text="One uppercase letter"
                      />
                      <RequirementItem
                        met={validations.hasLowercase}
                        text="One lowercase letter"
                      />
                      <RequirementItem
                        met={validations.hasNumber}
                        text="One number"
                      />
                      {confirmPassword && (
                        <RequirementItem
                          met={validations.passwordsMatch}
                          text="Passwords match"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !token ||
                    !Object.values(validations).every((v) => v)
                  }
                  className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin mr-3 h-5 w-5" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Reset Password
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center pt-4 border-t border-border">
                <p className="text-sm theme-muted">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="text-accent hover:text-accent/80 font-semibold transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
      </div>
    </>
  );
}

// Password requirement indicator component
function RequirementItem({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
      )}
      <span
        className={`text-sm ${met ? "text-green-600 dark:text-green-400" : "theme-muted"}`}
      >
        {text}
      </span>
    </div>
  );
}
