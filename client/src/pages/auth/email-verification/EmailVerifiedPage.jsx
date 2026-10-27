import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "../../../components/icons/Icons";
import api from "../../../services/api";
import AuthWatermarkBackground from "../../../components/layout/AuthWatermarkBackground";

const EmailVerifiedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const hasVerified = useRef(false); // Prevent double verification in StrictMode

  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent duplicate verification attempts (React StrictMode runs effects twice)
      if (hasVerified.current) {
        return;
      }
      hasVerified.current = true;
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        // Redirect to error page
        setTimeout(() => {
          navigate("/auth/verification-error", {
            state: { message: "Verification token is missing.", token },
          });
        }, 100);
        return;
      }

      try {
        const response = await api.get(`/api/auth/verify-email?token=${token}`);

        if (response.success) {
          setStatus("success");
          setMessage(response.message || "Email verified successfully!");

          // Countdown will tick in dedicated useEffect below
          setCountdown(5);

          // Don't return here - just let the function complete
        } else {
          setStatus("error");
          const errorMsg = response.error || "Verification failed.";
          setMessage(errorMsg);
          // Redirect to error page
          setTimeout(() => {
            navigate("/auth/verification-error", {
              state: { message: errorMsg, token },
            });
          }, 100);
        }
      } catch (error) {
        setStatus("error");
        const errorData = error.response?.data;

        if (errorData?.expired) {
          const errorMsg = "This verification link has expired.";
          setMessage(errorMsg);
          // Redirect to error page
          setTimeout(() => {
            navigate("/auth/verification-error", {
              state: { message: errorMsg, token },
            });
          }, 100);
        } else if (errorData?.alreadyVerified) {
          setMessage("This email is already verified. You can log in now.");
          setStatus("success");

          // Redirect to login
          setTimeout(() => {
            navigate("/login", {
              state: {
                message: "Your email is already verified. Please log in.",
                type: "info",
              },
            });
          }, 3000);
        } else {
          const errorMsg =
            errorData?.error || "Verification failed. Please try again.";
          setMessage(errorMsg);
          // Redirect to error page
          setTimeout(() => {
            navigate("/auth/verification-error", {
              state: { message: errorMsg, token },
            });
          }, 100);
        }
      }
    };

    verifyEmail();
  }, [token, navigate]);

  // Dedicated effect for redirect countdown (prevents React "Cannot update component in render" error)
  useEffect(() => {
    if (status !== "success") return;

    if (countdown <= 0) {
      navigate("/login", {
        state: {
          message: "Email verified! Please log in to continue.",
          type: "success",
        },
      });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, navigate]);

  if (status === "verifying") {
    return (
      <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Verifying State ───── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className=" md:hidden w-full max-w-md mx-auto min-h-screen theme-bg relative px-5 pt-12 pb-10 flex flex-col justify-center items-center overflow-x-hidden animate-fadeIn">
        <AuthWatermarkBackground />

        <div className="relative z-10 w-full text-center">
          <div className="w-24 h-24 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/50 dark:border-cyan-800/50 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
          </div>
          <h2 className="text-2xl font-extrabold theme-text tracking-tight mb-2">
            Verifying Your Email...
          </h2>
          <p className="text-xs theme-muted">
            Please wait while we verify your email address.
          </p>
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

        <div className="glass-card rounded-2xl p-12 text-center max-w-md w-full relative z-10 border-2 border-border">
          <Loader2 className="w-16 h-16 text-accent mx-auto animate-spin" />
          <h2 className="mt-6 text-2xl font-bold theme-text">
            Verifying Your Email...
          </h2>
          <p className="mt-3 theme-muted">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
      </div>
      </>
    );
  }

  if (status === "success") {
    return (
      <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Matching Screen 7 ──── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className=" md:hidden w-full max-w-md mx-auto min-h-screen theme-bg relative px-5 pt-10 pb-10 flex flex-col justify-between overflow-x-hidden animate-fadeIn">
        <AuthWatermarkBackground />

        <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center text-center">
          {/* Large Celebratory Badge with Confetti Dots */}
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border-2 border-cyan-200/50 dark:border-cyan-800/50 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
                <svg className="w-11 h-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            {/* Confetti / celebration dots */}
            <div className="absolute -top-2 left-3 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <div className="absolute top-4 -right-2 w-2 h-2 rounded-full bg-teal-400" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-sky-400" />
            <div className="absolute bottom-4 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <div className="absolute -bottom-3 right-8 w-1.5 h-1.5 rounded-full bg-teal-500" />
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl font-extrabold theme-text tracking-tight mb-2">
            Email Verified!
          </h1>
          <p className="text-xs theme-muted leading-relaxed px-4 max-w-xs mb-8">
            Your account is ready. You can now create and join secure polls.
          </p>

          {/* Continue Button */}
          <button
            onClick={() => navigate("/login", {
              state: {
                message: "Email verified! Please log in to continue.",
                type: "success",
              },
            })}
            className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Continue to VoteBooth</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <div className="relative z-10 text-center text-xs theme-muted">
          Redirecting in {countdown}s...
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

        <div className="glass-card rounded-2xl border-2 border-border p-12 text-center max-w-md w-full space-y-6 relative z-10 animate-pop">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 glass-card border-2 border-green-500/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold theme-text">Email Verified!</h1>
            <p className="theme-muted">{message}</p>
          </div>

          {/* Info Box */}
          <div className="glass-card border-2 border-green-500/20 rounded-lg p-4">
            <p className="text-sm theme-text">
              ✅ Your account is now active and ready to use.
            </p>
          </div>

          {/* Auto Redirect Notice with Countdown */}
          <div className="glass-card border-2 border-accent/20 rounded-lg p-4">
            <p className="text-sm theme-text text-center flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 text-accent" />
              Redirecting to login in{" "}
              <strong className="text-accent">{countdown}</strong> second
              {countdown !== 1 ? "s" : ""}...
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-theme rounded-lg font-medium transition-all duration-200 interactive-scale"
          >
            Go to Login
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>
      </>
    );
  }

  return null;
};

export default EmailVerifiedPage;
