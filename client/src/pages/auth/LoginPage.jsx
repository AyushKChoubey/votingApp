import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/layout/Alert";
import { LoadingButton } from "../../components/layout/Loading";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
          result.error || "Login failed. Please check your credentials.";
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
  );
}

export default Login;
