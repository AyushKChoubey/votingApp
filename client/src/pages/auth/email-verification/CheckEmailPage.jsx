import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, RefreshCw, ArrowRight } from 'lucide-react';
import {Toast} from '../../../components/layout/Toast';
import api from '../../../services/api';

const CheckEmailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const [isResending, setIsResending] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [cooldown, setCooldown] = useState(0);

    const handleResendEmail = async () => {
        if (!email) {
            setToast({
                show: true,
                message: 'Email address not found. Please register again.',
                type: 'error'
            });
            return;
        }

        if (cooldown > 0) {
            setToast({
                show: true,
                message: `Please wait ${cooldown} seconds before requesting again.`,
                type: 'warning'
            });
            return;
        }

        setIsResending(true);

        try {
            const response = await api.post('/api/auth/resend-verification', { email });

            if (response.data.success) {
                setToast({
                    show: true,
                    message: response.data.message || 'Verification email sent! Please check your inbox.',
                    type: 'success'
                });

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
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error 
                || 'Failed to resend verification email. Please try again.';
            
            setToast({
                show: true,
                message: errorMessage,
                type: 'error'
            });
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
                    <div className="mx-auto w-20 h-20 glass-card border-2 border-accent/20 rounded-full flex items-center justify-center">
                        <Mail className="w-10 h-10 text-accent" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold theme-text text-center">
                        Check Your Email
                    </h1>

                    {/* Message */}
                    <p className="theme-muted leading-relaxed text-center">
                        We've sent a verification link to{' '}
                        <span className="font-semibold theme-text">{email}</span>.
                        Please check your inbox and click the link to verify your account.
                    </p>

                    {/* Info Box */}
                    <div className="glass-card border-2 border-accent/20 rounded-lg p-4 space-y-2">
                        <p className="text-sm theme-text font-medium">📧 What to do next:</p>
                        <ul className="text-sm theme-muted space-y-1 list-disc list-inside">
                            <li>Open your email inbox</li>
                            <li>Look for an email from VoteBooth</li>
                            <li>Click the verification link</li>
                            <li>You'll be redirected to login</li>
                        </ul>
                    </div>

                    {/* Resend Button */}
                    <button
                        onClick={handleResendEmail}
                        disabled={isResending || cooldown > 0}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-theme rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 interactive-scale"
                    >
                        {isResending ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : cooldown > 0 ? (
                            `Resend available in ${cooldown}s`
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Resend Verification Email
                            </>
                        )}
                    </button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 glass-card theme-muted">or</span>
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-border theme-text rounded-lg font-medium hover:border-accent transition-all duration-200 interactive-scale"
                    >
                        Back to Login
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
};

export default CheckEmailPage;
