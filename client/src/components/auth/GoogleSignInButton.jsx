import React from 'react';
import { FcGoogle } from 'react-icons/fc';

const GoogleSignInButton = ({ text = 'Continue with Google' }) => {
  const handleGoogleSignIn = () => {
    // Get the API base URL from environment or default to localhost
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-teal-600 hover:shadow-md transition-all duration-200 group"
    >
      <FcGoogle className="text-2xl" />
      <span className="text-gray-700 font-medium group-hover:text-teal-700">
        {text}
      </span>
    </button>
  );
};

export default GoogleSignInButton;
