import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Secure Online Voting
              <span className="block text-teal-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create, manage, and participate in secure online voting with VoteBooth. 
              Perfect for organizations, communities, and teams of all sizes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="bg-white hover:bg-gray-50 text-teal-600 font-medium py-3 px-6 rounded-lg border border-teal-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                    Sign In
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    Go to Dashboard
                  </Link>
                  <Link to="/booth/create" className="bg-white hover:bg-gray-50 text-teal-600 font-medium py-3 px-6 rounded-lg border border-teal-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                    Create Booth
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12">
          <div className="w-72 h-72 bg-teal-200 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12">
          <div className="w-72 h-72 bg-teal-300 opacity-20 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose VoteBooth?
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need for secure and transparent online voting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-teal-200 transition-all duration-300 hover:shadow-xl transform hover:scale-105 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                End-to-end encryption and secure authentication ensure your votes remain private and secure.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-teal-200 transition-all duration-300 hover:shadow-xl transform hover:scale-105 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Create voting booths in minutes and get real-time results as votes come in.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-teal-200 transition-all duration-300 hover:shadow-xl transform hover:scale-105 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-teal-50">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy to Use</h3>
              <p className="text-gray-600">
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