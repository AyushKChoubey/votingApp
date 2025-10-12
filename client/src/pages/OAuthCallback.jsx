import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageLoading } from '../components/layout/Loading';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract token from URL query parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const errorMsg = params.get('error');

    if (errorMsg) {
      setError(errorMsg);
      setTimeout(() => {
        navigate('/login', { state: { error: errorMsg } });
      }, 2000);
      return;
    }

    if (token) {
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      setError('No authentication token received');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [location, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <PageLoading text="Signing you in..." />;
};

export default OAuthCallback;
