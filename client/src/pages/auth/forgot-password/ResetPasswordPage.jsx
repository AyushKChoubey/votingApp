import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
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
    const [tokenValid, setTokenValid] = useState(true);
    const [countdown, setCountdown] = useState(3);
    const alertTimeoutRef = useRef(null);

    // Auto-dismiss non-token alerts after 8 seconds
    useEffect(() => {
        if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
            alertTimeoutRef.current = null;
        }

        if (error) {
            alertTimeoutRef.current = setTimeout(() => {
                setError('');
                alertTimeoutRef.current = null;
            }, 8000);
        }

        return () => {
            if (alertTimeoutRef.current) {
                clearTimeout(alertTimeoutRef.current);
                alertTimeoutRef.current = null;
            }
        };
    }, [error]);

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
            setError('Invalid or missing reset token.');
            setTokenValid(false);
        }
    }, [token]);

    // Countdown for redirect after success
    useEffect(() => {
        if (success && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (success && countdown === 0) {
            navigate('/login', { 
                state: { 
                    message: 'Password reset successful! Please log in with your new password.',
                    type: 'success'
                }
            });
        }
    }, [success, countdown, navigate]);

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
            setError('Please meet all password requirements before submitting.');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/auth/reset-password', {
                token,
                password
            });

            if (response.success) {
                setSuccess(true);
            }
        } catch (err) {
            let errorMsg;
            
            if (!err.response) {
                errorMsg = 'Network error. Please check your internet connection and try again.';
            } else if (err.response.status === 400) {
                errorMsg = err.response?.data?.error || 'Invalid reset link. Please request a new password reset.';
                setTokenValid(false);
            } else if (err.response.status === 404) {
                errorMsg = 'Reset link has expired or is invalid. Please request a new password reset.';
                setTokenValid(false);
            } else if (err.response.status >= 500) {
                errorMsg = 'Server error. Please try again in a few moments.';
            } else {
                errorMsg = err.response?.data?.error || 'Failed to reset password. Please try again.';
            }
            
            setError(errorMsg);
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

                        {/* Countdown Message */}
                        <div className="glass-card border-2 border-accent/20 rounded-xl p-4 mb-6">
                            <p className="text-sm theme-text text-center flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 text-accent" />
                                Redirecting to login in <strong className="text-accent">{countdown}</strong> second{countdown !== 1 ? 's' : ''}...
                            </p>
                        </div>

                        {/* Manual Navigation */}
                        <Link 
                            to="/login" 
                            className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring flex items-center justify-center gap-2"
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
                    {/* Token Invalid Warning */}
                    {!tokenValid && (
                        <Alert 
                            type="error" 
                            message={
                                <div className="space-y-2">
                                    <p className="font-semibold">Invalid or Expired Reset Link</p>
                                    <p className="text-sm">This password reset link is no longer valid. Reset links expire after 10 minutes for security reasons.</p>
                                </div>
                            }
                            className="mb-5"
                        />
                    )}
                    
                    {error && tokenValid && <Alert type="error" message={error} className="mb-5" />}

                    {/* Token Invalid State */}
                    {!tokenValid ? (
                        <div className="space-y-5">
                            <div className="glass-card border-2 border-amber-500/20 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">What you can do:</p>
                                        <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                                            <li>Request a new password reset link</li>
                                            <li>Check your email for the most recent link</li>
                                            <li>Make sure you're using the complete link from the email</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to="/forgot-password"
                                className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Request New Reset Link
                            </Link>

                            <div className="text-center pt-4 border-t border-border">
                                <p className="text-sm theme-muted">
                                    Remember your password?{' '}
                                    <Link to="/login" className="text-accent hover:text-accent/80 font-semibold transition-colors">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </div>
                    ) : (
                    <>
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
                                    className={`w-full px-4 py-3 pr-12 theme-surface border-2 rounded-xl focus:outline-none focus:ring-2 theme-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        password && Object.values(validations).slice(0, 4).every(v => v)
                                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                                            : password
                                            ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20'
                                            : 'border-border focus:ring-accent focus:border-accent'
                                    }`}
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
                                    className={`w-full px-4 py-3 pr-12 theme-surface border-2 rounded-xl focus:outline-none focus:ring-2 theme-text transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        confirmPassword && validations.passwordsMatch
                                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                                            : confirmPassword && !validations.passwordsMatch
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                            : 'border-border focus:ring-accent focus:border-accent'
                                    }`}
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
                            disabled={loading || !token || !Object.values(validations).every(v => v)}
                            className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="animate-spin mr-3 h-5 w-5" />
                                    Resetting Password...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5 mr-2" />
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
                    </>
                    )}
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
