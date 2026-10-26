import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  XCircle,
  RefreshCw,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "../../../components/icons/Icons";
import { Alert } from "../../../components/layout/Alert";
import api from "../../../services/api";
import AuthWatermarkBackground from "../../../components/layout/AuthWatermarkBackground";

const VerificationErrorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const errorMessage = location.state?.message || "Verification failed.";

  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailError, setEmailError] = useState("");

  // Real-time email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleResendEmail = async () => {
    if (!email || !email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setSuccess("");
    setIsResending(true);

    try {
      const response = await api.post("/api/auth/resend-verification", {
        email: email.trim().toLowerCase(),
      });

      // Check response - backend always returns success message
      if (response && (response.success || response.message)) {
        setSuccess(
          response.message ||
            "Verification email sent! Please check your inbox.",
        );

        // Redirect to check email page after 2 seconds
        setTimeout(() => {
          navigate("/auth/check-email", {
            state: { email: email.trim().toLowerCase() },
          });
        }, 2000);
      } else {
        setError(response?.error || "Unexpected response from server.");
      }
    } catch (err) {
      let errorMessage;

      if (!err.response) {
        // Network error
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (err.response.status >= 500) {
        // Server error
        errorMessage = "Server error. Please try again in a few moments.";
      } else if (err.response.status === 429) {
        // Rate limit
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else {
        // Other errors
        errorMessage =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to resend verification email. Please try again.";
      }

      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Matching Screen 8 ──── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden w-full max-w-md mx-auto min-h-screen theme-bg relative px-5 pt-10 pb-10 flex flex-col justify-between overflow-x-hidden animate-fadeIn">
        <AuthWatermarkBackground />

        <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center text-center">
          {/* Soft Red Circular Badge with Warning Triangle */}
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50 flex items-center justify-center shadow-inner">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-500">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            {/* Subtle floating particles */}
            <div className="absolute -top-1 left-2 w-2 h-2 rounded-full bg-rose-400" />
            <div className="absolute top-2 -right-1 w-1.5 h-1.5 rounded-full bg-orange-400" />
            <div className="absolute -bottom-1 right-3 w-2 h-2 rounded-full bg-rose-300" />
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-2xl font-extrabold theme-text tracking-tight mb-2">
            Something Went Wrong
          </h1>
          <p className="text-xs theme-muted leading-relaxed px-4 max-w-xs mb-6">
            This link may have expired or something went wrong on our end. Please try again.
          </p>

          {error && (
            <div className="w-full mb-4 text-left">
              <Alert type="error" message={error} onClose={() => setError("")} />
            </div>
          )}
          {success && (
            <div className="w-full mb-4 text-left">
              <Alert type="success" message={success} onClose={() => setSuccess("")} />
            </div>
          )}

          {/* Email input toggle form for resend */}
          {showEmailInput ? (
            <div className="w-full space-y-3 mb-4 text-left animate-fadeIn">
              <label className="text-xs font-bold theme-text block">Enter your email to get a new link</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending || !email}
                  className="flex-1 py-3 rounded-2xl btn-theme text-on-primary font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {isResending ? "Sending..." : "Send New Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailInput(false)}
                  className="px-4 py-3 rounded-2xl border border-border theme-surface theme-text font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Action Buttons matching Screen 8 */
            <div className="w-full space-y-3">
              {/* Try Again Button */}
              <button
                onClick={() => setShowEmailInput(true)}
                className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Try Again</span>
              </button>

              {/* Back to Sign In Button */}
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3.5 rounded-2xl border border-border theme-surface theme-text font-bold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Sign In</span>
              </button>
            </div>
          )}

          {/* Contact Support */}
          <div className="mt-6">
            <button
              onClick={() => navigate("/help")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold theme-muted hover:theme-text transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Contact Support</span>
            </button>
          </div>
        </div>

        {/* Error code subtext at bottom */}
        <div className="relative z-10 text-center text-[11px] theme-muted pt-4">
          Error 400
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── DESKTOP VIEW ONLY (hidden md:block) - Preserved Desktop ─── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block w-full">
    <div className="min-h-screen theme-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
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

      <div className="max-w-md w-full space-y-6 relative z-10">
        <div className="glass-card rounded-2xl border-2 border-border p-8 text-center space-y-6 animate-pop">
          {/* Error Icon */}
          <div className="mx-auto w-20 h-20 glass-card border-2 border-red-500/30 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold theme-text">
              Verification Failed
            </h1>
            <p className="theme-muted">{errorMessage}</p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert type="error" message={error} className="text-left" />
          )}
          {success && (
            <Alert type="success" message={success} className="text-left" />
          )}

          {/* Info Box */}
          <div className="glass-card border-2 border-red-500/20 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm theme-text font-medium">🔗 Common Reasons:</p>
            <ul className="text-sm theme-muted space-y-1 list-disc list-inside">
              <li>Link has expired (valid for 24 hours)</li>
              <li>Link was already used</li>
              <li>Link was copied incorrectly</li>
              <li>Email may still be verifying (check inbox)</li>
            </ul>
          </div>

          {/* Email Input Section */}
          {showEmailInput && (
            <div className="space-y-3 animate-fadeIn">
              <div className="text-left">
                <label className="block text-sm font-medium theme-text mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 theme-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onKeyDown={(e) => e.key === "Enter" && handleResendEmail()}
                    placeholder="your.email@example.com"
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg focus:ring-2 outline-none transition-all duration-200 theme-surface theme-text ${
                      emailError
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : email && validateEmail(email)
                          ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                          : "border-border focus:border-accent focus:ring-accent/20"
                    }`}
                    autoFocus
                  />
                  {email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validateEmail(email) ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {emailError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {emailError}
                  </p>
                )}
              </div>

              <button
                onClick={handleResendEmail}
                disabled={isResending || !email || emailError}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-theme rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 interactive-scale"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`}
                />
                {isResending ? "Sending..." : "Send Verification Email"}
              </button>

              <button
                onClick={() => setShowEmailInput(false)}
                className="w-full px-6 py-2 theme-muted hover:theme-text text-sm font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {!showEmailInput && (
            <div className="space-y-3">
              <button
                onClick={() => setShowEmailInput(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-theme rounded-lg font-medium transition-all duration-200 interactive-scale"
              >
                <RefreshCw className="w-4 h-4" />
                Request New Verification Link
              </button>

              <button
                onClick={() => navigate("/register")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 glass-card border-2 border-border theme-text rounded-lg font-medium hover:border-accent transition-all duration-200 interactive-scale"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Registration
              </button>
            </div>
          )}

          {/* Support Link */}
          <p className="text-sm theme-muted">
            Need help?{" "}
            <button
              onClick={() => navigate("/help")}
              className="text-accent hover:text-accent-dark font-medium underline"
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
      </div>
    </>
  );
};

export default VerificationErrorPage;
