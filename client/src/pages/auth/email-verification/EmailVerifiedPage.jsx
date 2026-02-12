import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import api from '../../../services/api';

const EmailVerifiedPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const hasVerified = useRef(false); // Prevent double verification in StrictMode

    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const verifyEmail = async () => {
            // Prevent duplicate verification attempts (React StrictMode runs effects twice)
            if (hasVerified.current) {
                return;
            }
            hasVerified.current = true;
            if (!token) {
                setStatus('error');
                setMessage('Verification token is missing.');
                // Redirect to error page
                setTimeout(() => {
                    navigate('/auth/verification-error', {
                        state: { message: 'Verification token is missing.', token }
                    });
                }, 100);
                return;
            }

            try {
                const response = await api.get(`/api/auth/verify-email?token=${token}`);

                if (response.success) {
                    setStatus('success');
                    setMessage(response.message || 'Email verified successfully!');

                    // Auto redirect to login after 5 seconds
                    const interval = setInterval(() => {
                        setCountdown(prev => {
                            if (prev <= 1) {
                                clearInterval(interval);
                                navigate('/login', { 
                                    state: { 
                                        message: 'Email verified! Please log in to continue.',
                                        type: 'success' 
                                    } 
                                });
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                    
                    // Don't return here - just let the function complete
                } else {
                    setStatus('error');
                    const errorMsg = response.error || 'Verification failed.';
                    setMessage(errorMsg);
                    // Redirect to error page
                    setTimeout(() => {
                        navigate('/auth/verification-error', {
                            state: { message: errorMsg, token }
                        });
                    }, 100);
                }
            } catch (error) {
                setStatus('error');
                const errorData = error.response?.data;
                
                if (errorData?.expired) {
                    const errorMsg = 'This verification link has expired.';
                    setMessage(errorMsg);
                    // Redirect to error page
                    setTimeout(() => {
                        navigate('/auth/verification-error', {
                            state: { message: errorMsg, token }
                        });
                    }, 100);
                } else if (errorData?.alreadyVerified) {
                    setMessage('This email is already verified. You can log in now.');
                    setStatus('success');
                    
                    // Redirect to login
                    setTimeout(() => {
                        navigate('/login', {
                            state: {
                                message: 'Your email is already verified. Please log in.',
                                type: 'info'
                            }
                        });
                    }, 3000);
                } else {
                    const errorMsg = errorData?.error || 'Verification failed. Please try again.';
                    setMessage(errorMsg);
                    // Redirect to error page
                    setTimeout(() => {
                        navigate('/auth/verification-error', {
                            state: { message: errorMsg, token }
                        });
                    }, 100);
                }
            }
        };

        verifyEmail();
    }, [token, navigate]);

    if (status === 'verifying') {
        return (
            <div className="min-h-screen theme-bg flex items-center justify-center px-4 relative overflow-hidden">
                {/* Floating orbs background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float" style={{"--float-distance": "30px"}}></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{"--float-distance": "-40px", "--float-duration": "8s"}}></div>
                </div>
                
                <div className="glass-card rounded-2xl p-12 text-center max-w-md w-full relative z-10 border-2 border-border">
                    <Loader2 className="w-16 h-16 text-accent mx-auto animate-spin" />
                    <h2 className="mt-6 text-2xl font-bold theme-text">
                        Verifying Your Email...
                    </h2>
                    <p className="mt-3 theme-muted">
                        Please wait while we verify your email address.
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen theme-bg flex items-center justify-center px-4 relative overflow-hidden">
                {/* Floating orbs background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float" style={{"--float-distance": "30px"}}></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{"--float-distance": "-40px", "--float-duration": "8s"}}></div>
                </div>
                
                <div className="glass-card rounded-2xl border-2 border-border p-12 text-center max-w-md w-full space-y-6 relative z-10 animate-pop">
                    {/* Success Icon */}
                    <div className="mx-auto w-20 h-20 glass-card border-2 border-green-500/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>

                    {/* Success Message */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold theme-text">
                            Email Verified!
                        </h1>
                        <p className="theme-muted">
                            {message}
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="glass-card border-2 border-green-500/20 rounded-lg p-4">
                        <p className="text-sm theme-text">
                            ✅ Your account is now active and ready to use.
                        </p>
                    </div>

                    {/* Auto Redirect Notice with Countdown */}
                    <div className="glass-card border-2 border-accent/20 rounded-lg p-4">
                        <p className="text-sm theme-text text-center flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 text-accent" />
                            Redirecting to login in <strong className="text-accent">{countdown}</strong> second{countdown !== 1 ? 's' : ''}...
                        </p>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-theme rounded-lg font-medium transition-all duration-200 interactive-scale"
                    >
                        Go to Login
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default EmailVerifiedPage;
