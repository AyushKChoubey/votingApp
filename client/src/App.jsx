import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/layout/Toast';
import Layout from './components/layout/Layout';
import { PageLoading } from './components/layout/Loading';
import { apiService } from './services/api';

// Pages - will be created next
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import HelpPage from './pages/HelpPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import OAuthCallback from './pages/OAuthCallback';

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
    // Preserve the full path/search so after login we can return the user to where they intended
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

// App Routes Component
const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Auth Routes */}
        <Route path="/auth/callback" element={<OAuthCallback />} />
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

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
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
    </Layout>
  );
};

// Main App Component
function App() {
  const [appReady, setAppReady] = useState(false);
  const [startupError, setStartupError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const waitForServer = async () => {
      const maxAttempts = 5;
      let attempt = 0;
      let delay = 1000; // start with 1s

      while (attempt < maxAttempts && mounted) {
        try {
          attempt += 1;
          await apiService.healthCheck();
          if (mounted) {
            setAppReady(true);
            setStartupError(null);
          }
          return;
        } catch (err) {
          // Keep trying until max attempts
          setStartupError(`Attempt ${attempt} failed—waiting ${delay / 1000}s to retry`);
          // exponential backoff
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, delay));
          delay *= 2;
        }
      }

      if (mounted) {
        setStartupError('Unable to reach backend after multiple attempts. You can retry or continue offline.');
        setAppReady(true); // allow app to continue (user can retry actions manually)
      }
    };

    waitForServer();

    return () => {
      mounted = false;
    };
  }, []);

  if (!appReady) {
    return <PageLoading message={startupError || 'Waking up backend service — this may take a few seconds...'} />;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <div className="App">
              <AppRoutes />
            </div>
          </ToastProvider>
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
