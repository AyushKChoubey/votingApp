import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/layout/Alert";
import { LoadingButton } from "../../components/layout/Loading";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import AuthWatermarkBackground from "../../components/layout/AuthWatermarkBackground";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for invite code and redirect URL in query parameters
    const invite = searchParams.get("invite");
    const redirect = searchParams.get("redirect");
    const message = searchParams.get("message");

    if (invite) {
      setInviteCode(invite);
    }
    if (redirect) {
      // redirect may be URL-encoded (encoded by ProtectedRoute). Decode safely.
      try {
        setRedirectUrl(decodeURIComponent(redirect));
      } catch (e) {
        setRedirectUrl(redirect);
      }
    }
    
    // Show session expired message
    if (message === "session_expired") {
      setError("Your session has expired. Please log in again.");
    }

    // Check for success or error message from location state (e.g. from password reset or email verification)
    if (location.state?.message) {
      if (location.state.type === "error") {
        setError(location.state.message);
      } else {
        setSuccessMsg(location.state.message);
      }
      // Clear location state to prevent repeating on refresh
      window.history.replaceState({}, document.title);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);

      // Check if email verification is required
      if (result.requiresVerification) {
        // Redirect to check email page with ability to resend
        navigate("/auth/check-email", {
          state: {
            email: result.email || formData.email.trim().toLowerCase(),
            fromLogin: true,
          },
        });
        return;
      }

      if (result.success) {
        // If there's a redirect URL (from invite link), use it
        if (redirectUrl) {
          navigate(redirectUrl);
        } else if (inviteCode) {
          // If there's an invite code but no specific redirect, go to join page
          navigate(`/booth/join/${inviteCode}`);
        } else {
          // Default redirect to dashboard
          navigate("/dashboard");
        }
      } else {
        // Display error from login result
        const errorMsg =
          result.error && result.error.includes("Invalid email or password")
            ? "Invalid email or password. Password does not match our records."
            : result.error || "Login failed. Please check your credentials.";
        setError(errorMsg);
      }
    } catch (err) {
      // Handle unexpected errors
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Matching Screen 1 ──── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden w-full max-w-md mx-auto min-h-screen theme-bg relative px-5 pt-8 pb-10 flex flex-col justify-between overflow-x-hidden animate-fadeIn">
        <AuthWatermarkBackground />

        <div className="relative z-10 w-full">
          {/* Top Bar with Back Button */}
          <div className="flex items-center mb-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl border border-border theme-surface flex items-center justify-center text-main shadow-xs active:scale-95 transition-transform"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Logo Badge + Brand Name */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-md shadow-cyan-500/25 flex items-center justify-center mb-2">
              <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-xs font-bold theme-text tracking-tight uppercase">VoteBooth</span>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold theme-text tracking-tight mb-1">
              {inviteCode ? "Sign in to Join" : "Welcome Back"}
            </h1>
            <p className="text-xs theme-muted">
              {inviteCode ? "Sign in to accept booth invitation" : "Sign in to your VoteBooth account"}
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
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold theme-text mb-1 block">Password</label>
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
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:theme-text"
                  aria-label="Toggle password visibility"
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
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="remember-me"
                  defaultChecked
                  className="rounded border-border text-accent focus:ring-accent w-4 h-4"
                />
                <span className="theme-muted font-medium">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-accent hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Social Separator */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-border/80" />
            <span className="px-3 text-xs theme-muted">or</span>
            <div className="flex-1 border-t border-border/80" />
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton text="Continue with Google" />
        </div>

        {/* Footer Link */}
        <div className="relative z-10 text-center pt-6 text-xs theme-muted">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-accent hover:underline">
            Sign up
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
        {/* Invite Code Banner */}
        {inviteCode && (
          <div className="glass-card border-2 border-accent/30 rounded-2xl p-6 text-center mb-6 animate-slideDown">
            <div className="flex items-center justify-center mb-4">
              <div className="glass-card p-3 rounded-xl mr-3">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-2-4h4m-4-4v8m-6-4V8a4 4 0 118 0v4M3 12a9 9 0 0118 0 9 9 0 01-18 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="theme-text font-bold text-xl">
                  🎉 You're Invited!
                </h3>
                <p className="text-accent text-sm">Join a voting booth</p>
              </div>
            </div>
            <p className="theme-muted text-sm mb-3">
              You've been invited to join a booth! Sign in to continue and start
              voting.
            </p>
            <div className="glass-card rounded-lg px-4 py-2 inline-block">
              <p className="theme-text text-sm font-medium">
                Invite Code:{" "}
                <span className="font-mono font-bold text-accent">
                  {inviteCode}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="flex justify-center mb-4">
            <div className="glass-card p-4 rounded-2xl interactive-scale border-2 border-accent/20">
              <svg
                className="w-10 h-10 text-accent"
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
          <h1 className="text-3xl sm:text-4xl font-bold theme-text mb-2">
            {inviteCode ? "Sign in to Join" : "Welcome Back"}
          </h1>
          <p className="text-base theme-muted">
            {inviteCode
              ? "Sign in to accept the booth invitation"
              : "Sign in to your VoteBooth account"}
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-border animate-pop">
          {error && (
            <div className="mb-4">
              <Alert
                type="error"
                message={error}
                onClose={() => setError("")}
              />
            </div>
          )}
          {successMsg && (
            <div className="mb-4">
              <Alert
                type="success"
                message={successMsg}
                onClose={() => setSuccessMsg("")}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium theme-text mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 theme-surface border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent theme-text transition-all duration-300"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium theme-text mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 theme-surface border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent theme-text transition-all duration-300 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center theme-muted hover:text-accent transition-colors"
                >
                  {showPassword ? (
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-accent focus:ring-accent border-border rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm theme-text"
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors "
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin mr-3 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 glass-card theme-muted font-medium">
                  or
                </span>
              </div>
            </div>

            <div className="mt-4">
              <GoogleSignInButton text="Continue with Google" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm theme-muted">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-accent hover:text-accent/80 font-semibold transition-colors "
              >
                Sign up
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

export default Login;
