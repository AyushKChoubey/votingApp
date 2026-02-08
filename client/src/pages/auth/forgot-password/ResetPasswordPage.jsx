import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { Alert } from '../../../components/layout/Alert';

export default function ResetPasswordPage() {
    // URL params and navigation
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    // Form state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Password strength validation state
    const [validations, setValidations] = useState({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        passwordsMatch: false
    });

    // Check if token exists
    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new password reset link.');
        }
    }, [token]);

    // Validate password in real-time
    useEffect(() => {
        setValidations({
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            passwordsMatch: password === confirmPassword && password.length > 0
        });
    }, [password, confirmPassword]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate all requirements met
        const allValid = Object.values(validations).every(v => v === true);
        if (!allValid) {
            setError('Please meet all password requirements');
            return;
        }

        setLoading(true);

        try {
            // Call reset password API
            const response = await api.post('/api/auth/reset-password', {
                token,
                password
            });

            if (response.success) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    // Show success message
    if (success) {
        return (
            <div className="min-h-screen theme-bg flex items-center justify-center py-4 sm:py-8 px-4 relative overflow-hidden">
                {/* Floating orbs background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float" style={{"--float-distance": "30px"}}></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{"--float-distance": "-40px", "--float-duration": "8s"}}></div>
                </div>

                <div className="max-w-md w-full relative z-10">
                    <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-border animate-pop">
                        {/* Success Icon */}
                        <div className="flex justify-center mb-6 animate-fadeIn">
                            <div className="glass-card p-4 rounded-2xl border-2 border-green-500/30">
                                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Success Message */}
                        <div className="text-center space-y-3 mb-6">
                            <h2 className="text-2xl sm:text-3xl font-bold theme-text">Password Reset Successful!</h2>
                            <p className="theme-muted text-base">
                                Your password has been changed successfully. You can now log in with your new password.
                            </p>
                        </div>

                        {/* Redirecting Message */}
                        <div className="glass-card border-2 border-accent/20 rounded-xl p-4 mb-6">
                            <p className="text-sm theme-muted text-center">
                                Redirecting to login page...
                            </p>
                        </div>

                        {/* Manual Navigation */}
                        <Link 
                            to="/login" 
                            className="w-full btn-theme ripple py-3.5 rounded text-base font-semibold focus-ring flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Show reset form
    return (
        <div className="min-h-screen theme-bg flex items-center justify-center py-4 sm:py-8 px-4 relative overflow-hidden">
            {/* Floating orbs background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float" style={{"--float-distance": "30px"}}></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{"--float-distance": "-40px", "--float-duration": "8s"}}></div>
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Logo and Header */}
                <div className="text-center mb-8 animate-fadeIn">
                    <div className="flex justify-center mb-4">
                        <div className="glass-card p-4 rounded-2xl interactive-scale border-2 border-accent/20">
                            <Lock className="w-10 h-10 text-accent" />
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold theme-text mb-2">
                        Reset Password
                    </h1>
                    <p className="text-base theme-muted">
                        Create a strong password to secure your account
                    </p>
                </div>

                <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-border animate-pop">
                    {error && <Alert type="error" message={error} />}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium theme-text mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    disabled={!token}
                                    className="w-full px-4 py-3 pr-12 theme-surface border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent theme-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted hover:text-accent transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium theme-text mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    disabled={!token}
                                    className="w-full px-4 py-3 pr-12 theme-surface border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent theme-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 theme-muted hover:text-accent transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements */}
                        {password && (
                            <div className="glass-card border-2 border-border rounded-xl p-4 space-y-2">
                                <p className="text-sm font-medium theme-text mb-3">Password Requirements:</p>
                                <div className="space-y-1.5">
                                    <RequirementItem met={validations.minLength} text="At least 8 characters" />
                                    <RequirementItem met={validations.hasUppercase} text="One uppercase letter" />
                                    <RequirementItem met={validations.hasLowercase} text="One lowercase letter" />
                                    <RequirementItem met={validations.hasNumber} text="One number" />
                                    {confirmPassword && (
                                        <RequirementItem met={validations.passwordsMatch} text="Passwords match" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="w-full btn-theme ripple py-3.5 rounded text-base font-semibold focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Resetting Password...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    Reset Password
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center pt-4 border-t border-border">
                        <p className="text-sm theme-muted">
                            Remember your password?{' '}
                            <Link to="/login" className="text-accent hover:text-accent/80 font-semibold transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Password requirement indicator component
function RequirementItem({ met, text }) {
    return (
        <div className="flex items-center gap-2">
            {met ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
            )}
            <span className={`text-sm ${met ? 'text-green-600 dark:text-green-400' : 'theme-muted'}`}>
                {text}
            </span>
        </div>
    );
}
