import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Analytics } from '@vercel/analytics/react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/layout/Toast';
import Layout from './components/layout/Layout';
import { PageLoading } from './components/layout/Loading';
import { apiService } from './services/api';

// Pages - will be created next
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/user/DashboardPage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import ContactPage from './pages/ContactPage';
import HelpPage from './pages/HelpPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ProfilePage from './pages/user/ProfilePage';
import SettingsPage from './pages/user/SettingsPage';
import OAuthCallback from './pages/auth/OAuthCallback';

// Email Verification Pages
import CheckEmailPage from './pages/auth/email-verification/CheckEmailPage';
import EmailVerifiedPage from './pages/auth/email-verification/EmailVerifiedPage';
import VerificationErrorPage from './pages/auth/email-verification/VerificationErrorPage';

// Password Reset Pages
import ForgotPasswordPage from './pages/auth/forgot-password/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/forgot-password/ResetPasswordPage';

// Booth Pages
import CreateBoothPage from './pages/booth/CreateBoothPage';
import JoinBoothPage from './pages/booth/JoinBoothPage';
import BoothDetailPage from './pages/booth/BoothDetailPage';
import BoothAdminPage from './pages/booth/BoothAdminPage';
import BoothResultsPage from './pages/booth/BoothResultsPage';


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
    const returnTo = encodeURIComponent(location.pathname + (location.search || ''));
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
    const redirectParam = params.get('redirect');
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
        <Route path="/auth/verification-error" element={<VerificationErrorPage />} />
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
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />

        {/* Booth Routes */}
        <Route 
          path="/booth/create" 
          element={
            <ProtectedRoute>
              <CreateBoothPage />
            </ProtectedRoute>
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
            <ProtectedRoute>
              <BoothDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/booth/:boothId/admin" 
          element={
            <ProtectedRoute>
              <BoothAdminPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/booth/:boothId/results" 
          element={
            <ProtectedRoute>
              <BoothResultsPage />
            </ProtectedRoute>
          } 
        />

        {/* 404 Route */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
  );
};

// Main App Component
function App() {
  const [appReady, setAppReady] = useState(false);
  const [startupError, setStartupError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const waitForServer = async () => {
      // First attempt
      try {
        await apiService.healthCheck();
        if (mounted) {
          setAppReady(true);
          setStartupError(null);
        }
        return;
      } catch (err) {
        // First attempt failed, wait 2 seconds and try again
        await new Promise((res) => setTimeout(res, 2000));
        
        // Second attempt
        try {
          await apiService.healthCheck();
          if (mounted) {
            setAppReady(true);
            setStartupError(null);
          }
          return;
        } catch (err2) {
          // Both attempts failed: show message and poll for up to 40s
          if (mounted) {
            setStartupError('Waking up backend service — this may take up to 40 seconds.');
          }

          const maxWaitMs = 40 * 1000; // 40 seconds
          const intervalMs = 5000; // check every 5 seconds
          const start = Date.now();

          while (mounted && Date.now() - start < maxWaitMs) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((res) => setTimeout(res, intervalMs));
            try {
              await apiService.healthCheck();
              if (mounted) {
                setAppReady(true);
                setStartupError(null);
              }
              return;
            } catch (e) {
              // keep waiting until timeout
            }
          }

          if (mounted) {
            setStartupError('Unable to reach backend after waiting. You can retry or continue offline.');
            setAppReady(true); // allow app to continue (user can retry actions manually)
          }
        }
      }
    };

    waitForServer();

    return () => {
      mounted = false;
    };
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
      <ReactQueryDevtools initialIsOpen={false} />
      <Analytics />
    </QueryClientProvider>
  );
}

export default App;
