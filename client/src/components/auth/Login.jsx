import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../layout/Alert';
import { LoadingButton } from '../layout/Loading';
import GoogleSignInButton from './GoogleSignInButton';

export function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [redirectUrl, setRedirectUrl] = useState('');
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    useEffect(() => {
        // Check for invite code and redirect URL in query parameters
        const invite = searchParams.get('invite');
        const redirect = searchParams.get('redirect');
        
        if (invite) {
            setInviteCode(invite);
        }
        if (redirect) {
            setRedirectUrl(redirect);
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                // If there's a redirect URL (from invite link), use it
                if (redirectUrl) {
                    navigate(redirectUrl);
                } else if (inviteCode) {
                    // If there's an invite code but no specific redirect, go to join page
                    navigate(`/booth/join/${inviteCode}`);
                } else {
                    // Default redirect to dashboard
                    navigate('/dashboard');
                }
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center py-2 sm:py-4 px-3 sm:px-4 lg:px-8 relative">
            {/* Back to Home Link - Hidden on mobile, visible on sm screens and up */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 hidden sm:block">
                <Link 
                    to="/" 
                    className="inline-flex items-center text-teal-600 hover:text-teal-700 transition-colors duration-300 group bg-white/50 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/70"
                >
                    <svg className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                </Link>
            </div>
            
            <div className="max-w-md w-full">
                
                {/* Invite Code Banner */}
                {inviteCode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center mb-3 sm:mb-4">
                        <div className="flex items-center justify-center mb-2">
                            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-2-4h4m-4-4v8m-6-4V8a4 4 0 118 0v4M3 12a9 9 0 0118 0 9 9 0 01-18 0z" />
                            </svg>
                            <span className="text-blue-800 font-semibold">Booth Invitation</span>
                        </div>
                        <p className="text-blue-700 text-sm">
                            You've been invited to join a booth! Sign in to continue.
                        </p>
                        <p className="text-blue-600 text-xs mt-1">Invite Code: <strong>{inviteCode}</strong></p>
                    </div>
                )}
                
                {/* Logo and Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-0 sm:mb-1">
                        <div className="bg-teal-600 p-2.5 sm:p-3.5 rounded-lg sm:rounded-2xl transition-all duration-300 hover:scale-110 hover:bg-teal-700">
                            <svg className="w-7 h-7 sm:w-9 sm:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                        {inviteCode ? 'Sign in to Join Booth' : 'Welcome back'}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                        {inviteCode ? 'Sign in to accept the booth invitation' : 'Sign in to your VoteBooth account'}
                    </p>
                </div>
                
                {/* Login Form */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-8 border border-gray-100 backdrop-blur-sm transition-all duration-300 hover:shadow-3xl mt-3 sm:mt-5">
                    {error && <Alert type="error" message={error} />}
                    
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-sm"
                                    placeholder="Enter your email"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 pr-10 sm:pr-12 text-sm"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>
                            <Link to="/forgot-password" className="text-xs sm:text-sm text-teal-600 hover:text-teal-500 font-medium transition-colors duration-300 hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-3 sm:py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 border border-teal-600 rounded-lg text-sm sm:text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>
                    
                    {/* Social Login */}
                    <div className="mt-2 sm:mt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center text-xs sm:text-sm">
                                <span className="px-3 bg-white text-gray-400 font-medium">or</span>
                            </div>
                        </div>
                        
                        <div className="mt-2 sm:mt-4">
                            <GoogleSignInButton text="Continue with Google" />
                        </div>
                    </div>
                    
                    <div className="mt-2 sm:mt-4 text-center px-2">
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                            Don't have an account?{' '}
                            <Link 
                                to="/register" 
                                className="text-teal-600 hover:text-teal-500 font-semibold transition-colors duration-200 hover:underline"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}