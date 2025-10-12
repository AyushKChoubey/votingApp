import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingButton } from '../layout/Loading';
import { Alert } from '../layout/Alert';
import GoogleSignInButton from './GoogleSignInButton';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const result = await register(formData);
            if (result.success) {
                navigate('/dashboard');
            } else {
                // Handle specific error cases
                if (result.error && result.error.includes('Email already registered')) {
                    setError('This email is already registered. Please try logging in or use a different email.');
                } else {
                    setError(result.error || 'Registration failed');
                }
            }
        } catch (error) {
            // Handle HTTP status code specific errors
            if (error.status === 409) {
                setError('This email is already registered. Please try logging in or use a different email.');
            } else if (error.status === 400) {
                setError(error.message || 'Please check your input and try again.');
            } else {
                setError(error.message || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center py-2 sm:py-6 px-3 sm:px-4 relative">
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
                <div className="text-center">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-0 sm:mb-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-teal-700">
                            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-gray-900">VoteBooth</span>
                    </Link>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Create Account</h2>
                    <p className="text-sm sm:text-base text-gray-600">Join thousands of users creating secure polls</p>
                </div>
                
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-3xl mt-2 sm:mt-4">
                    {error && <Alert type="error" message={error} />}
                    
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="Enter your full name"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Email Address
                            </label>
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
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-sm"
                                    placeholder="Create a strong password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                        
                        <div>
                            <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-sm"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showConfirmPassword ? (
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

                        <div className="flex items-start sm:items-center">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded mt-1 sm:mt-0 flex-shrink-0"
                            />
                            <label htmlFor="terms" className="ml-2 block text-xs sm:text-sm text-gray-700 leading-relaxed">
                                I agree to the{' '}
                                <Link to="/terms" className="text-teal-600 hover:text-teal-500 font-medium transition-colors duration-300">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link to="/privacy" className="text-teal-600 hover:text-teal-500 font-medium transition-colors duration-300">
                                    Privacy Policy
                                </Link>
                            </label>
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Create Account
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
                            Already have an account?{' '}
                            <Link 
                                to="/login" 
                                className="text-teal-600 hover:text-teal-500 font-semibold transition-colors duration-200 hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;