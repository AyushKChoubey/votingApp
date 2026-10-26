import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Clock,
  XCircle,
} from "../../../components/icons/Icons";
import api from "../../../services/api";
import { Alert } from "../../../components/layout/Alert";
import AuthWatermarkBackground from "../../../components/layout/AuthWatermarkBackground";

export default function ForgotPasswordPage() {
  // Form state
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailValidation, setEmailValidation] = useState({
    isValid: false,
    message: "",
  });
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Mask email for privacy (show first 2-3 chars, mask middle, show last 2 chars and domain)
  const maskEmail = (email) => {
    if (!email || !email.includes("@")) return email;

    const [localPart, domain] = email.split("@");

    if (localPart.length <= 3) {
      return email;
    } else if (localPart.length <= 5) {
      return `${localPart.substring(0, 2)}*${localPart.substring(localPart.length - 2)}@${domain}`;
    } else {
      const visibleStart = 3;
      const visibleEnd = 2;
      const maskedLength = localPart.length - visibleStart - visibleEnd;
      const maskedPart = "*".repeat(Math.min(maskedLength, 5));
      return `${localPart.substring(0, visibleStart)}${maskedPart}${localPart.substring(localPart.length - visibleEnd)}@${domain}`;
    }
  };

  // Real-time email validation
  const validateEmailInput = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailValidation({ isValid: false, message: "" });
    } else if (!emailRegex.test(value)) {
      setEmailValidation({
        isValid: false,
        message: "Please enter a valid email address",
      });
    } else {
      setEmailValidation({ isValid: true, message: "Valid email format" });
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmailInput(value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!emailValidation.isValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before requesting again.`);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/auth/forgot-password", { email });

      if (response.success) {
        setSuccess(true);
        setSuccessMsg("Password reset email sent! Please check your inbox.");

        // Set 60-second cooldown
        setCooldown(60);
        const interval = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } catch (err) {
      let errorMsg;
      if (!err.response) {
        errorMsg =
          "Network error. Please check your internet connection and try again.";
        setShowTroubleshooting(true);
      } else if (err.response.status >= 500) {
        errorMsg = "Server error. Please try again in a few moments.";
      } else {
        errorMsg =
          err.response?.data?.error ||
          "Failed to send reset email. Please try again.";
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before requesting again.`);
      return;
    }

    setSuccess(false);
    setError("");
    setSuccessMsg("");
  };

  // Show success message after email sent
  if (success) {
    const maskedEmail = maskEmail(email);

    return (
      <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Reset Email Sent ───── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden w-full max-w-md mx-auto min-h-screen theme-bg relative px-5 pt-8 pb-10 flex flex-col justify-between overflow-x-hidden animate-fadeIn">
        <AuthWatermarkBackground />

        <div className="relative z-10 w-full">
          {/* Central Envelope Illustration */}
          <div className="flex flex-col items-center justify-center mb-6 mt-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/50 dark:border-cyan-800/50 flex items-center justify-center shadow-inner">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white shadow-md">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-white dark:border-surface flex items-center justify-center text-white shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold theme-text tracking-tight mb-2">
              Check Your Email
            </h1>
            <p className="text-xs theme-muted leading-relaxed px-4">
              We sent a password reset link to{" "}
              <span className="font-bold theme-text">{maskedEmail}</span>. Tap the link to reset your password.
            </p>
          </div>

          <div className="space-y-3">
            {/* Open Email App */}
            <a
              href="mailto:"
              className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Open Email App</span>
            </a>

            {/* Resend Email */}
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className="w-full py-3.5 rounded-2xl border border-border theme-surface theme-text font-bold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Resend Email</span>
            </button>

            {cooldown > 0 && (
              <p className="text-center text-xs theme-muted">
                You can resend in {cooldown}s
              </p>
            )}
          </div>
        </div>

        {/* Footer Links & Spam Callout */}
        <div className="relative z-10 space-y-4 pt-6">
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Sign in</span>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 bg-surface/50 text-[11px] theme-muted text-center">
            <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <line x1="12" y1="16" x2="12" y2="12" strokeWidth={2} strokeLinecap="round" />
              <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth={2} strokeLinecap="round" />
            </svg>
            <span>Can't find it? Check your spam folder.</span>
          </div>
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
          <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-border animate-pop space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center animate-fadeIn">
              <div className="glass-card p-4 rounded-2xl border-2 border-green-500/30">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold theme-text">
                Check Your Email
              </h2>
              <p className="theme-muted text-base">
                If an account exists with{" "}
                <span className="font-semibold theme-text">{maskedEmail}</span>,
                you will receive a password reset link shortly.
              </p>
            </div>

            {/* Info Box */}
            <div className="glass-card border-2 border-accent/20 rounded-lg p-4 space-y-3">
              <p className="text-sm theme-text font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                What to do next:
              </p>
              <ul className="text-sm theme-muted space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">1.</span>
                  <span>Check your email inbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">2.</span>
                  <span>
                    Look for an email from VoteBooth{" "}
                    <strong>(check spam folder)</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">3.</span>
                  <span>
                    Click the reset link <strong>(valid for 10 minutes)</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">4.</span>
                  <span>Create your new password</span>
                </li>
              </ul>
            </div>

            {/* Troubleshooting Section */}
            <div className="space-y-3">
              <button
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="w-full flex items-center justify-between px-4 py-3 glass-card border border-border rounded-lg theme-text hover:border-accent transition-all duration-200"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <HelpCircle className="w-4 h-4" />
                  Not receiving emails?
                </span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showTroubleshooting ? "rotate-180" : ""}`}
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

              {showTroubleshooting && (
                <div className="glass-card border border-border rounded-lg p-4 space-y-3 animate-fadeIn">
                  <p className="text-sm theme-text font-medium">
                    🔍 Troubleshooting Tips:
                  </p>
                  <ul className="text-xs theme-muted space-y-2">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                      <span>
                        Check your <strong>spam or junk mail</strong> folder
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                      <span>Wait a few minutes - emails can be delayed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                      <span>Verify you entered the correct email address</span>
                    </li>
                  </ul>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs theme-muted">
                      Still having issues?{" "}
                      <Link
                        to="/contact"
                        className="text-accent hover:underline font-medium"
                      >
                        Contact Support
                      </Link>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Back to Login */}
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Login
            </Link>

            {/* Resend Option */}
            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : "Didn't receive the email? Try again"}
              </button>
            </div>
          </div>
        </div>{" "}
      </div>
      </div>
      </>
    );
  }

  // Show forgot password form
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Matching Screen 3 ──── */}
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

          {/* Center Illustration - Lock & Key with subtle floating dots */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/50 dark:border-cyan-800/50 flex items-center justify-center shadow-inner">
                <div className="relative flex items-center justify-center">
                  {/* Padlock Icon */}
                  <svg className="w-12 h-12 text-cyan-500" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 00-7.5 0v3h7.5z" clipRule="evenodd" />
                  </svg>
                  {/* Key graphic overlapping */}
                  <div className="absolute -bottom-1 -right-2 bg-gradient-to-tr from-cyan-400 to-sky-400 p-1.5 rounded-full shadow-md text-white">
                    <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Floating particles */}
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div className="absolute top-1/2 -left-3 w-1.5 h-1.5 rounded-full bg-sky-400" />
              <div className="absolute -bottom-1 left-2 w-2 h-2 rounded-full bg-teal-400" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold theme-text tracking-tight mb-2">
              Forgot Password?
            </h1>
            <p className="text-xs theme-muted leading-relaxed px-4">
              No worries. Enter your email and we'll send you a link to reset it.
            </p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} onClose={() => setError("")} />
            </div>
          )}
          {successMsg && (
            <div className="mb-4">
              <Alert type="success" message={successMsg} onClose={() => setSuccessMsg("")} />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold theme-text mb-1 block">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                />
              </div>
              {emailValidation.message && (
                <p className={`text-[11px] mt-1.5 ${emailValidation.isValid ? "text-emerald-500" : "text-rose-500"}`}>
                  {emailValidation.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !emailValidation.isValid || cooldown > 0}
              className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Sending...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Back Link */}
        <div className="relative z-10 text-center pt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Sign in</span>
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
              <Mail className="w-10 h-10 text-accent" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold theme-text mb-2">
            Forgot Password?
          </h1>
          <p className="text-base theme-muted">
            No worries! Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-border animate-pop">
          {error && <Alert type="error" message={error} className="mb-5" />}
          {successMsg && (
            <Alert type="success" message={successMsg} className="mb-5" />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium theme-text mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  required
                  className={`w-full px-4 py-3 theme-surface border-2 rounded-xl focus:outline-none focus:ring-2 theme-text transition-all duration-300 ${
                    emailValidation.isValid
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                      : email && !emailValidation.isValid
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-border focus:ring-accent focus:border-accent"
                  }`}
                />
                {email && (
                  <div
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      emailValidation.isValid
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {emailValidation.isValid ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>
                )}
              </div>
              {emailValidation.message && (
                <p
                  className={`text-xs mt-1.5 ${emailValidation.isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {emailValidation.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !emailValidation.isValid || cooldown > 0}
              className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin mr-3 h-5 w-5" />
                  Sending...
                </>
              ) : cooldown > 0 ? (
                `Resend available in ${cooldown}s`
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
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
      </div>
    </div>
      </div>
    </>
  );
}
