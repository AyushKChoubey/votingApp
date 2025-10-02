import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/?message=logged_out');
  };

  const isActivePath = (path) => location.pathname === path;

  const publicNavItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/features', label: 'Features' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/contact', label: 'Contact' },
  ];

  const userNavItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/booth/create', label: 'Create Booth' },
    { path: '/booth/join', label: 'Join Booth' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-teal-700">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">VoteSecure</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="ml-10 flex items-center space-x-6">
              {/* Public nav items */}
              {!isAuthenticated && publicNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-300 rounded-md ${
                    isActivePath(item.path) 
                      ? 'text-teal-600 bg-teal-50' 
                      : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* User nav items */}
              {isAuthenticated && userNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-300 rounded-md ${
                    isActivePath(item.path) 
                      ? 'text-teal-600 bg-teal-50' 
                      : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Auth buttons */}
              {!isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-teal-600 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-6 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors rounded-md hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-600 font-medium text-sm">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{user?.name}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <Link
                        to="/help"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Help
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Medium screen navigation - show all nav links */}
          <div className="hidden md:flex lg:hidden items-center space-x-4">
            <div className="flex items-center space-x-4">
              {/* Public nav items */}
              {!isAuthenticated && publicNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2 py-2 text-sm font-medium transition-all duration-300 rounded-md ${
                    isActivePath(item.path) 
                      ? 'text-teal-600 bg-teal-50' 
                      : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* User nav items */}
              {isAuthenticated && userNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2 py-2 text-sm font-medium transition-all duration-300 rounded-md ${
                    isActivePath(item.path) 
                      ? 'text-teal-600 bg-teal-50' 
                      : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Auth buttons */}
              {!isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/login" 
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-teal-600 transition-all duration-300"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-teal-600 transition-colors rounded-md hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-600 font-medium text-sm">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu for medium screens */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <Link
                        to="/help"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Help
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Popup */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            ></div>
            
            {/* Mobile Menu Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl transform transition-transform">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-900">VoteSecure</span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                  <div className="space-y-2">
                    {(!isAuthenticated ? publicNavItems : userNavItems).map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 ${
                          isActivePath(item.path) 
                            ? 'text-teal-600 bg-teal-50 border-l-4 border-teal-600' 
                            : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}

                    {/* User Profile Section for Authenticated Users */}
                    {isAuthenticated && (
                      <>
                        <div className="border-t border-gray-200 my-4 pt-4">
                          <div className="flex items-center px-4 py-2 mb-2">
                            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-teal-600 font-medium">
                                {user?.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                              <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Link 
                          to="/profile" 
                          className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-xl transition-all duration-300" 
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        
                        <Link 
                          to="/settings" 
                          className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-xl transition-all duration-300" 
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="border-t border-gray-200 p-4">
                  {!isAuthenticated ? (
                    <div className="space-y-3">
                      <Link 
                        to="/login" 
                        className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-xl border border-gray-300 transition-all duration-300" 
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link 
                        to="/register" 
                        className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all duration-300 shadow-lg" 
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  ) : (
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold">VoteSecure</span>
            </div>
            <p className="text-gray-400 mb-3 max-w-md text-sm">
              Secure, transparent, and easy-to-use online voting platform for organizations, 
              communities, and teams of all sizes.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Company</h3>
            <ul className="space-y-1">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm">About</Link></li>
              <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Legal</h3>
            <ul className="space-y-1">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors text-sm">Help Center</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 VoteSecure. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

const Layout = ({ children, showFooter = true }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;