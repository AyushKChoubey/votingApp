import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { PageLoading } from './components/layout/Loading';

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

  if (isLoading) {
    return <PageLoading message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=true" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  if (isAuthenticated) {
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
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </AuthProvider>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
