import React, { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/layout/Toast";
import Layout from "./components/layout/Layout";
import { PageLoading } from "./components/layout/Loading";
import { trackPageView, initGA } from "./utils/analytics";

// Pages - will be created next
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import Dashboard from "./pages/user/DashboardPage";
import AboutPage from "./pages/AboutPage";
import FeaturesPage from "./pages/FeaturesPage";
import ContactPage from "./pages/ContactPage";
import HelpPage from "./pages/HelpPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import OAuthCallback from "./pages/auth/OAuthCallback";

// Email Verification Pages
import CheckEmailPage from "./pages/auth/email-verification/CheckEmailPage";
import EmailVerifiedPage from "./pages/auth/email-verification/EmailVerifiedPage";
import VerificationErrorPage from "./pages/auth/email-verification/VerificationErrorPage";

// Password Reset Pages
import ForgotPasswordPage from "./pages/auth/forgot-password/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/forgot-password/ResetPasswordPage";

// Booth Pages — lazy loaded (heavy, not needed on first paint)
import JoinBoothPage from "./pages/booth/JoinBoothPage";
const ProfilePage = lazy(() => import("./pages/user/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/user/SettingsPage"));
const CreateBoothPage = lazy(() => import("./pages/booth/CreateBoothPage"));
const BoothDetailPage = lazy(() => import("./pages/booth/BoothDetailPage"));
const BoothAdminPage = lazy(() => import("./pages/booth/BoothAdminPage"));
const BoothResultsPage = lazy(() => import("./pages/booth/BoothResultsPage"));

// Dev tools — excluded from production bundle via dead-code elimination
const DevTools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    );

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoading message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // so after login we can return the user to where they intended
    const returnTo = encodeURIComponent(
      location.pathname + (location.search || ""),
    );
    return <Navigate to={`/login?redirect=${returnTo}`} replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  if (isAuthenticated) {
    // If the login page was requested with a redirect query (encoded path), prefer that
    // so authenticated users who landed here via a protected-route redirect go to their
    // intended destination instead of the dashboard.
    const params = new URLSearchParams(location.search);
    const redirectParam = params.get("redirect");
    if (redirectParam) {
      try {
        const decoded = decodeURIComponent(redirectParam);
        return <Navigate to={decoded} replace />;
      } catch (e) {
        return <Navigate to="/dashboard" replace />;
      }
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Routes Component (must be inside AuthProvider)
const AppRoutes = () => {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Auth Routes */}
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/auth/check-email" element={<CheckEmailPage />} />
      <Route path="/auth/verify-email" element={<EmailVerifiedPage />} />
      <Route
        path="/auth/verification-error"
        element={<VerificationErrorPage />}
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/profile"
        element={
          <Suspense fallback={<PageLoading />}>
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/user/settings"
        element={
          <Suspense fallback={<PageLoading />}>
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          </Suspense>
        }
      />

      {/* Booth Routes */}
      <Route
        path="/booth/create"
        element={
          <Suspense fallback={<PageLoading />}>
            <ProtectedRoute>
              <CreateBoothPage />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/booth/join"
        element={
          <ProtectedRoute>
            <JoinBoothPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booth/join/:code"
        element={
          <ProtectedRoute>
            <JoinBoothPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/booth/:boothId"
        element={
          <Suspense fallback={<PageLoading />}>
            <ProtectedRoute>
              <BoothDetailPage />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/booth/:boothId/admin"
        element={
          <Suspense fallback={<PageLoading />}>
            <ProtectedRoute>
              <BoothAdminPage />
            </ProtectedRoute>
          </Suspense>
        }
      />
      <Route
        path="/booth/:boothId/results"
        element={
          <Suspense fallback={<PageLoading />}>
            <ProtectedRoute>
              <BoothResultsPage />
            </ProtectedRoute>
          </Suspense>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
};

// Main App Component
function App() {
  // Initialize Google Analytics once on app mount
  useEffect(() => {
    initGA();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Layout>
                <AppRoutes />
              </Layout>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
      <Suspense fallback={null}>
        <DevTools initialIsOpen={false} />
      </Suspense>
      <Analytics />
      <SpeedInsights />
    </QueryClientProvider>
  );
}

export default App;
