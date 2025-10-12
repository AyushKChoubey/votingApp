import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Mobile Optimized */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-8 pb-8 sm:pt-16 sm:pb-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-6 leading-tight">
              Secure Online Voting
              <span className="block text-teal-600 text-xl sm:text-2xl md:text-4xl mt-1">Made Simple</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 max-w-2xl mx-auto px-2">
              Create, manage, and participate in secure online voting with VoteBooth. 
              Perfect for organizations, communities, and teams.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center max-w-md mx-auto">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg transition-all duration-300 shadow-lg w-full sm:w-auto text-center">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="bg-white hover:bg-gray-50 text-teal-600 text-sm font-medium py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg border border-teal-600 transition-all duration-300 shadow-md w-full sm:w-auto text-center">
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg transition-all duration-300 shadow-lg w-full sm:w-auto text-center">
                    Go to Dashboard
                  </Link>
                  <Link to="/booth/create" className="bg-white hover:bg-gray-50 text-teal-600 text-sm font-medium py-2.5 px-4 sm:py-3 sm:px-6 rounded-lg border border-teal-600 transition-all duration-300 shadow-md w-full sm:w-auto text-center">
                    Create Booth
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Background decoration - Smaller for mobile */}
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 sm:-translate-y-12 sm:translate-x-12">
          <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-teal-200 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-8 -translate-x-8 sm:translate-y-12 sm:-translate-x-12">
          <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 bg-teal-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </div>

      {/* Features Preview - Mobile Optimized */}
      <div className="py-8 sm:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
              Why Choose VoteBooth?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 px-4">
              Everything you need for secure online voting
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4 sm:p-6 rounded-lg border border-gray-200 hover:border-teal-200 transition-all duration-300 hover:shadow-lg hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Secure & Private</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                End-to-end encryption and secure authentication ensure your votes remain private and secure.
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 rounded-lg border border-gray-200 hover:border-teal-200 transition-all duration-300 hover:shadow-lg hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Lightning Fast</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Create voting booths in minutes and get real-time results as votes come in.
              </p>
            </div>

            <div className="text-center p-4 sm:p-6 rounded-lg border border-gray-200 hover:border-teal-200 transition-all duration-300 hover:shadow-lg hover:bg-gradient-to-br hover:from-cyan-50 hover:to-teal-50 sm:col-span-2 md:col-span-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-2">Easy to Use</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Intuitive interface that anyone can use, from tech novices to power users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;