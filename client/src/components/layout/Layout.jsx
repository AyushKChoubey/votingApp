import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // If neither the desktop menu nor the mobile menu contain the click, close menu
      const clickedInsideDesktop = menuRef.current && menuRef.current.contains(e.target);
      const clickedInsideMobile = mobileMenuRef.current && mobileMenuRef.current.contains(e.target);
      if (isMenuOpen && !clickedInsideDesktop && !clickedInsideMobile) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    return undefined;
  }, [isMenuOpen]);
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
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-16">
          {/* Logo - Mobile Optimized */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-teal-700">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">VoteBooth</span>
            </Link>
          </div>

          {/* Desktop Navigation - Wider viewports */}
          <div className="hidden md:block flex-1">
            <div className="flex items-center justify-between">
              {/* Left side - All nav items always visible */}
              <div className="ml-6 flex items-center space-x-4 lg:space-x-6">
                {publicNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-2 lg:px-3 py-2 text-xs lg:text-sm font-medium transition-all duration-300 rounded-md ${
                      isActivePath(item.path) 
                        ? 'text-teal-600 bg-teal-50' 
                        : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Right side - Dashboard + Auth */}
              <div className="flex items-center space-x-2 lg:space-x-4">
                {/* Dashboard - only when authenticated */}
                {isAuthenticated && (
                  <Link
                    to="/dashboard"
                    className={`flex items-center px-3 lg:px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                      isActivePath('/dashboard')
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-md'
                        : 'text-teal-700 bg-teal-50 hover:from-teal-500 hover:to-cyan-500 hover:text-white hover:bg-gradient-to-r'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
                    </svg>
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                )}

                {/* Auth buttons */}
                {!isAuthenticated ? (
                  <>
                    <Link 
                      to="/login" 
                      className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-lg transition-all duration-300"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/register" 
                      className="px-4 lg:px-6 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all duration-300 shadow-md"
                    >
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center space-x-2 px-2 py-1.5 text-gray-700 hover:text-teal-600 transition-colors rounded-md hover:bg-gray-50"
                    >
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-teal-100 rounded-full flex items-center justify-center">
                        <span className="text-teal-600 font-medium text-xs lg:text-sm">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-xs lg:text-sm hidden sm:block">{user?.name}</span>
                      <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>



          {/* Mobile menu button + Profile icon - Enhanced Design */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Profile icon - only when authenticated */}
            {isAuthenticated && (
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-teal-600 font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Hamburger menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Popup (full-screen, non-scrollable) */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            ></div>
            
            {/* Fullscreen Mobile Menu Panel - covers entire viewport and prevents scrolling */}
            <div ref={mobileMenuRef} className="fixed inset-0 bg-white shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Header - Improved Spacing */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-base font-bold text-gray-900">VoteBooth</span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Navigation Links - enhanced spacing; content is fixed (no scroll) */}
                <div className="flex-1 py-4 px-4">
                  <div className="space-y-1 h-full">
                    {/* Always show public nav items */}
                    {publicNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                          isActivePath(item.path) 
                            ? 'text-teal-600 bg-teal-50 border-l-4 border-teal-600 shadow-sm' 
                            : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}

                    {/* Auth Actions - Improved Design */}
                    {!isAuthenticated && (
                      <div className="pt-4 mt-4 border-t border-gray-100">
                        <div className="space-y-3">
                          <Link 
                            to="/login" 
                            className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-all duration-200 shadow-sm" 
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign In
                          </Link>
                          <Link 
                            to="/register" 
                            className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200" 
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Sign Up
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Dashboard + User Settings for Authenticated Users */}
                    {isAuthenticated && (
                      <>
                        <div className="border-t border-gray-200 my-4 pt-4">
                          {/* Dashboard with unique styling */}
                          <Link
                            to="/dashboard"
                            className={`flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 mb-3 ${
                              isActivePath('/dashboard')
                                ? 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-md border-0'
                                : 'text-teal-700 bg-teal-50 hover:from-teal-500 hover:to-cyan-500 hover:text-white hover:bg-gradient-to-r'
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
                            </svg>
                            Dashboard
                          </Link>
                        </div>
                        
                        <Link 
                          to="/profile" 
                          className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-xl transition-all duration-200 mx-0 mb-1" 
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        
                        <Link 
                          to="/settings" 
                          className="flex items-center px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-gray-50 rounded-xl transition-all duration-200 mx-0 mb-1" 
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.50 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Actions - Enhanced Logout */}
                {isAuthenticated && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <button 
                      onClick={handleLogout} 
                      className="flex items-center justify-center w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
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
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-2">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold">VoteBooth</span>
            </div>
            <p className="text-gray-400 mb-2 sm:mb-3 max-w-md text-xs sm:text-sm leading-relaxed">
              Secure, transparent, and easy-to-use online voting platform for organizations, 
              communities, and teams of all sizes.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="mt-2 sm:mt-0">
            <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-2 sm:mb-3">Company</h3>
            <ul className="space-y-0.5 sm:space-y-1">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-0.5">About</Link></li>
              <li><Link to="/features" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-0.5">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-0.5">Pricing</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-0.5">Contact</Link></li>
            </ul>
          </div>

          <div className="mt-2 sm:mt-0">
            <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-2 sm:mb-3">Legal</h3>
            <ul className="space-y-0.5 sm:space-y-1">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-0.5">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-0.5">Terms of Service</Link></li>
              <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-0.5">Help Center</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-xs sm:text-sm">
            © 2025 VoteBooth. All rights reserved.
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