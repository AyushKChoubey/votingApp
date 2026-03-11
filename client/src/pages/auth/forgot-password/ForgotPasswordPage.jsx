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
    );
  }

  // Show forgot password form
  return (
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
  );
}
