import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, RefreshCw, ArrowRight, AlertCircle, HelpCircle, Clock } from 'lucide-react';
import { Alert } from '../../../components/layout/Alert';
import api from '../../../services/api';

const CheckEmailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);
    const alertTimeoutRef = useRef(null);

    // Auto-dismiss alerts after a short period
    useEffect(() => {
        // Clear any existing timer
        if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
            alertTimeoutRef.current = null;
        }

        if (error || success) {
            alertTimeoutRef.current = setTimeout(() => {
                setError('');
                setSuccess('');
                alertTimeoutRef.current = null;
            }, 8000); // 8 seconds
        }

        return () => {
            if (alertTimeoutRef.current) {
                clearTimeout(alertTimeoutRef.current);
                alertTimeoutRef.current = null;
            }
        };
    }, [error, success]);

    // Mask email for privacy (show first 2-3 and last 2 chars of local part)
    const maskEmail = (email) => {
        if (!email) return '';
        const [localPart, domain] = email.split('@');
        if (localPart.length <= 4) {
            return `${localPart[0]}***@${domain}`;
        }
        const visibleStart = localPart.slice(0, Math.min(3, localPart.length - 2));
        const visibleEnd = localPart.slice(-2);
        return `${visibleStart}***${visibleEnd}@${domain}`;
    };

    const handleResendEmail = async () => {
        if (!email) {
            setError('Email address not found. Please register again.');
            return;
        }

        if (cooldown > 0) {
            setError(`Please wait ${cooldown} seconds before requesting again.`);
            return;
        }

        setError('');
        setSuccess('');
        setIsResending(true);

        try {
            const response = await api.post('/api/auth/resend-verification', { email });

            // `api` interceptor returns `response.data` directly, so `response` is the body
            if (response && response.success) {
                setSuccess(response.message || 'Verification email sent! Please check your inbox.');

                // Set 60-second cooldown
                setCooldown(60);
                const interval = setInterval(() => {
                    setCooldown(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                // Backend may return a generic success response; handle unexpected shapes
                const msg = (response && (response.message || response.error)) || 'Verification email sent! Please check your inbox.';
                setSuccess(msg);
            }
        } catch (err) {
            let errorMessage;
            
            if (!err.response) {
                // Network error
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (err.response.status >= 500) {
                // Server error
                errorMessage = 'Server error. Please try again in a few moments.';
            } else if (err.response.status === 429) {
                // Rate limit
                errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else {
                // Other errors
                errorMessage = err.response?.data?.error || 'Failed to resend verification email. Please try again.';
            }
            
            setError(errorMessage);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen theme-bg flex items-center justify-center px-4 relative overflow-hidden">
            {/* Floating orbs background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float" style={{"--float-distance": "30px"}}></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{"--float-distance": "-40px", "--float-duration": "8s"}}></div>
            </div>
            
            <div className="glass-card rounded-2xl border-2 border-border p-8 sm:p-12 max-w-md w-full space-y-6 relative z-10 animate-pop">
                <div className="space-y-6">
                    {/* Icon */}
                    <div className="flex justify-center animate-fadeIn">
                        <div className="glass-card p-4 rounded-2xl border-2 border-accent/30">
                            <Mail className="w-12 h-12 text-accent" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center space-y-3">
                        <h1 className="text-2xl sm:text-3xl font-bold theme-text">
                            Check Your Email
                        </h1>
                        <p className="theme-muted leading-relaxed text-base">
                            We've sent a verification link to{' '}
                            <span className="font-semibold theme-text">{maskEmail(email)}</span>.
                            Please check your inbox (and spam/junk folder) to verify your account.
                        </p>
                    </div>

                    {/* Alerts */}
                    {error && <Alert type="error" message={error} className="mb-4" />}
                    {success && <Alert type="success" message={success} className="mb-4" />}

                    {/* Info Box */}
                    <div className="glass-card border-2 border-accent/20 rounded-lg p-4 space-y-2">
                        <p className="text-sm theme-text font-medium">📧 What to do next:</p>
                        <ul className="text-sm theme-muted space-y-1 list-disc list-inside">
                            <li>Open your email inbox <strong>(check spam)</strong></li>
                            <li>Look for an email from VoteBooth</li>
                            <li>Click the verification link</li>
                            <li>You'll be redirected to login</li>
                        </ul>
                    </div>

                    {/* Troubleshooting Section */}
                    <div className="space-y-3">
                        <button
                            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                            className="w-full flex items-center justify-between px-4 py-3 glass-card border border-border rounded-lg theme-text hover:border-accent transition-all duration-200"
                        >
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <HelpCircle className="w-4 h-4" />
                                Not receiving emails?
                            </span>
                            <svg
                                className={`w-4 h-4 transition-transform duration-200 ${showTroubleshooting ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showTroubleshooting && (
                            <div className="glass-card border border-border rounded-lg p-4 space-y-3 animate-fadeIn">
                                <p className="text-sm theme-text font-medium">🔍 Troubleshooting Tips:</p>
                                <ul className="text-xs theme-muted space-y-2">
                                    <li className="flex items-start gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                                        <span>Check your <strong>spam or junk mail</strong> folder</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                                        <span>Wait a few minutes - emails can be delayed</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                                        <span>Verify you entered the correct email: <strong>{email}</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <RefreshCw className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-500" />
                                        <span>Use the resend button below</span>
                                    </li>
                                </ul>
                                <div className="pt-2 border-t border-border">
                                    <p className="text-xs theme-muted">
                                        Still having issues?{' '}
                                        <button
                                            onClick={() => navigate('/help')}
                                            className="text-accent hover:underline font-medium"
                                        >
                                            Contact Support
                                        </button>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Back to Login Button */}
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Login
                    </button>

                    {/* Resend Option */}
                    <div className="text-center">
                        <button
                            onClick={handleResendEmail}
                            disabled={isResending || cooldown > 0}
                            className="text-sm text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isResending ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Sending...
                                </span>
                            ) : cooldown > 0 ? (
                                `Resend available in ${cooldown}s`
                            ) : (
                                "Didn't receive the email? Resend verification"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckEmailPage;
