import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, RefreshCw, Mail, ArrowLeft } from 'lucide-react';
import { Toast } from '../../../components/layout/Toast';
import api from '../../../services/api';

const VerificationErrorPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const errorMessage = location.state?.message || 'Verification failed.';

    const [email, setEmail] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [showEmailInput, setShowEmailInput] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    const handleResendEmail = async () => {
        if (!email || !email.trim()) {
            setToast({
                show: true,
                message: 'Please enter your email address.',
                type: 'error'
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setToast({
                show: true,
                message: 'Please enter a valid email address.',
                type: 'error'
            });
            return;
        }

        setIsResending(true);

        try {
            const response = await api.post('/api/auth/resend-verification', { 
                email: email.trim().toLowerCase() 
            });

            // response received for resend verification

            // Check response - backend always returns success message
            if (response && (response.success || response.message)) {
                setToast({
                    show: true,
                    message: response.message || 'Verification email sent! Please check your inbox.',
                    type: 'success'
                });

                // Redirect to check email page after 2 seconds
                setTimeout(() => {
                    navigate('/auth/check-email', {
                        state: { email: email.trim().toLowerCase() }
                    });
                }, 2000);
            } else {
                setToast({
                    show: true,
                    message: response?.error || 'Unexpected response from server.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            console.error('Error response:', error.response);
            
            const errorMsg = error.response?.data?.error 
                || error.response?.data?.message
                || error.message
                || 'Failed to resend verification email. Please try again.';
            
            setToast({
                show: true,
                message: errorMsg,
                type: 'error'
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen theme-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Floating orbs background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float" style={{"--float-distance": "30px"}}></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{"--float-distance": "-40px", "--float-duration": "8s"}}></div>
            </div>
            
            <div className="max-w-md w-full space-y-6 relative z-10">
                <div className="glass-card rounded-2xl border-2 border-border p-8 text-center space-y-6 animate-pop">
                    {/* Error Icon */}
                    <div className="mx-auto w-20 h-20 glass-card border-2 border-red-500/30 rounded-full flex items-center justify-center">\n                        <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                        <XCircle className="w-12 h-12 text-white" />
                    </div>

                    {/* Error Message */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold theme-text">
                            Verification Failed
                        </h1>
                        <p className="theme-muted">
                            {errorMessage}
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="glass-card border-2 border-red-500/20 rounded-lg p-4 text-left space-y-2">
                        <p className="text-sm theme-text font-medium">
                            🔗 Common Reasons:
                        </p>
                        <ul className="text-sm theme-muted space-y-1 list-disc list-inside">
                            <li>Link has expired (valid for 24 hours)</li>
                            <li>Link was already used</li>
                            <li>Link was copied incorrectly</li>
                        </ul>
                    </div>

                        {/* Email Input Section */}
                        {showEmailInput && (
                            <div className="space-y-3 animate-fadeIn">
                                <div className="text-left">
                                    <label className="block text-sm font-medium theme-text mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 theme-muted" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleResendEmail()}
                                            placeholder="your.email@example.com"
                                            className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all duration-200 theme-surface theme-text"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleResendEmail}
                                    disabled={isResending}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-theme rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 interactive-scale"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                                    {isResending ? 'Sending...' : 'Send Verification Email'}
                                </button>

                                <button
                                    onClick={() => setShowEmailInput(false)}
                                    className="w-full px-6 py-2 theme-muted hover:theme-text text-sm font-medium transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {!showEmailInput && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowEmailInput(true)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-theme rounded-lg font-medium transition-all duration-200 interactive-scale"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Request New Verification Link
                                </button>

                                <button
                                    onClick={() => navigate('/register')}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 glass-card border-2 border-border theme-text rounded-lg font-medium hover:border-accent transition-all duration-200 interactive-scale"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Registration
                                </button>
                            </div>
                        )}

                        {/* Support Link */}
                        <p className="text-sm theme-muted">
                            Need help?{' '}
                            <button
                                onClick={() => navigate('/help')}
                                className="text-accent hover:text-accent-dark font-medium underline"
                            >
                                Contact Support
                            </button>
                        </p>
                    </div>
                </div>

            {/* Toast Notification */}
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

export default VerificationErrorPage;
