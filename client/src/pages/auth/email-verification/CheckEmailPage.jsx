 import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Mail,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Clock,
} from "../../../components/icons/Icons";
import { Alert } from "../../../components/layout/Alert";
import AuthWatermarkBackground from "../../../components/layout/AuthWatermarkBackground";
import api from "../../../services/api";

const CheckEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const alertTimeoutRef = useRef(null);

  // Auto-dismiss alerts after a short period
  useEffect(() => {
    // Clear any existing timer
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }

    if (error || success) {
      alertTimeoutRef.current = setTimeout(() => {
        setError("");
        setSuccess("");
        alertTimeoutRef.current = null;
      }, 8000); // 8 seconds
    }

    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = null;
      }
    };
  }, [error, success]);

  // Mask email for privacy (show first 2-3 and last 2 chars of local part)
  const maskEmail = (email) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 4) {
      return `${localPart[0]}***@${domain}`;
    }
    const visibleStart = localPart.slice(0, Math.min(3, localPart.length - 2));
    const visibleEnd = localPart.slice(-2);
    return `${visibleStart}***${visibleEnd}@${domain}`;
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Email address not found. Please register again.");
      return;
    }

    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before requesting again.`);
      return;
    }

    setError("");
    setSuccess("");
    setIsResending(true);

    try {
      const response = await api.post("/api/auth/resend-verification", {
        email,
      });

      // `api` interceptor returns `response.data` directly, so `response` is the body
      if (response && response.success) {
        setSuccess(
          response.message ||
            "Verification email sent! Please check your inbox.",
        );

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
        // Backend may return a generic success response; handle unexpected shapes
        const msg =
          (response && (response.message || response.error)) ||
          "Verification email sent! Please check your inbox.";
        setSuccess(msg);
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
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Matching Screen 6 ──── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className=" md:hidden w-full max-w-md mx-auto min-h-screen theme-bg relative px-5 pt-8 pb-10 flex flex-col justify-between overflow-x-hidden animate-fadeIn">
        <AuthWatermarkBackground />

        <div className="relative z-10 w-full">
          {/* Central Envelope Illustration with checkmark badge */}
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Subtle floating dots */}
              <div className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-cyan-400" />
              <div className="absolute bottom-3 -left-1 w-1.5 h-1.5 rounded-full bg-sky-400" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold theme-text tracking-tight mb-2">
              Check Your Email
            </h1>
            <p className="text-xs theme-muted leading-relaxed px-4">
              We sent a verification link to{" "}
              <span className="font-bold theme-text">{email ? maskEmail(email) : "your email"}</span>. Tap the link to activate your account.
            </p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} onClose={() => setError("")} />
            </div>
          )}
          {success && (
            <div className="mb-4">
              <Alert type="success" message={success} onClose={() => setSuccess("")} />
            </div>
          )}

          {/* Action Buttons */}
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
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              className="w-full py-3.5 rounded-2xl border border-border theme-surface theme-text font-bold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isResending ? "Sending..." : "Resend Email"}</span>
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
          <div className="flex flex-col items-center gap-2 text-xs">
            <Link
              to="/register"
              className="text-accent hover:underline font-semibold"
            >
              Wrong email? <span className="underline">Change it</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-bold theme-muted hover:theme-text"
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
    <div className="min-h-screen theme-bg flex items-center justify-center px-4 relative overflow-hidden">
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

      <div className="glass-card rounded-2xl border-2 border-border p-8 sm:p-12 max-w-md w-full space-y-6 relative z-10 animate-pop">
        <div className="space-y-6">
          {/* Icon */}
          <div className="flex justify-center animate-fadeIn">
            <div className="glass-card p-4 rounded-2xl border-2 border-accent/30">
              <Mail className="w-12 h-12 text-accent" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold theme-text">
              Check Your Email
            </h1>
            <p className="theme-muted leading-relaxed text-base">
              We've sent a verification link to{" "}
              <span className="font-semibold theme-text">
                {maskEmail(email)}
              </span>
              . Please check your inbox (and spam/junk folder) to verify your
              account.
            </p>
          </div>

          {/* Alerts */}
          {error && <Alert type="error" message={error} className="mb-4" />}
          {success && (
            <Alert type="success" message={success} className="mb-4" />
          )}

          {/* Info Box */}
          <div className="glass-card border-2 border-accent/20 rounded-lg p-4 space-y-2">
            <p className="text-sm theme-text font-medium">
              📧 What to do next:
            </p>
            <ul className="text-sm theme-muted space-y-1 list-disc list-inside">
              <li>
                Open your email inbox <strong>(check spam)</strong>
              </li>
              <li>Look for an email from VoteBooth</li>
              <li>Click the verification link</li>
              <li>You'll be redirected to login</li>
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
                    <span>
                      Verify you entered the correct email:{" "}
                      <strong>{email}</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <RefreshCw className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-500" />
                    <span>Use the resend button below</span>
                  </li>
                </ul>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs theme-muted">
                    Still having issues?{" "}
                    <button
                      onClick={() => navigate("/help")}
                      className="text-accent hover:underline font-medium"
                    >
                      Contact Support
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Back to Login Button */}
          <button
            onClick={() => navigate("/login")}
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
          </button>

          {/* Resend Option */}
          <div className="text-center">
            <button
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              className="text-sm text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : cooldown > 0 ? (
                `Resend available in ${cooldown}s`
              ) : (
                "Didn't receive the email? Resend verification"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
      </div>
    </>
  );
};

export default CheckEmailPage;
