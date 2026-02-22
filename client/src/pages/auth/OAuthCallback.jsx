import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageLoading } from "../../components/layout/Loading";
import { useAuth } from "../../context/AuthContext";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const errorMsg = params.get("error");

    if (errorMsg) {
      setError(errorMsg);
      setTimeout(() => {
        navigate("/login", { state: { error: errorMsg } });
      }, 2000);
      return;
    }

    if (token) {
      (async () => {
        try {
          // Set auth state in context first, THEN navigate.
          // This prevents the ProtectedRoute from seeing isAuthenticated=false
          // and flashing the login page before the checkAuth effect fires.
          const result = await loginWithToken(token);
          if (result.success) {
            const redirectParam = params.get('redirect');
            if (redirectParam) {
              try {
                const decoded = decodeURIComponent(redirectParam);
                // Validate decoded redirect to prevent open-redirects
                const isSafeRedirect = (p) => {
                  if (!p || typeof p !== 'string') return false;
                  if (!p.startsWith('/')) return false;
                  if (p.startsWith('//')) return false;
                  if (p.includes('\\')) return false;
                  if (p.includes('://')) return false;
                  // disallow CRLF and control chars
                  if (/\r|\n/.test(p)) return false;
                  return true;
                };
                if (isSafeRedirect(decoded)) {
                  navigate(decoded, { replace: true });
                  return;
                }
              } catch (e) {
                // fallthrough to dashboard
              }
            }

            navigate('/dashboard', { replace: true });
          } else {
            setError(result.error || 'Authentication failed');
            setTimeout(() => navigate('/login'), 2000);
          }
        } catch (e) {
          // Handle network/runtime errors from loginWithToken
          setError(e?.message || 'Authentication failed');
          setTimeout(() => navigate('/login'), 2000);
        }
      })();
    } else {
      setError("No authentication token received");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  }, [location, navigate, loginWithToken]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg">
        <div className="theme-surface p-8 rounded-lg shadow-md max-w-md w-full text-center border border-border">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold theme-text mb-2">
            Authentication Error
          </h2>
          <p className="theme-muted mb-4">{error}</p>
          <p className="text-sm theme-muted">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <PageLoading message="Signing you in..." />;
};

export default OAuthCallback;
