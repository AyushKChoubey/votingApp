import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import api from '../../../services/api';
import { Alert } from '../../../components/layout/Alert';

export default function ForgotPasswordPage() {
    // Form state
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Call forgot password API
            const response = await api.post('/api/auth/forgot-password', { email });
            
            if (response.success) {
                setSuccess(true);
            } else {
                setError('Failed to send reset email. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Show success message after email sent
    if (success) {
        return (
            <div className="min-h-screen theme-bg flex items-center justify-center py-4 sm:py-8 px-4 relative overflow-hidden">
                {/* Floating orbs background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float" style={{"--float-distance": "30px"}}></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{"--float-distance": "-40px", "--float-duration": "8s"}}></div>
                </div>
                
                <div className="max-w-md w-full relative z-10">
                    {/* Success Card */}
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
                            <h2 className="text-2xl sm:text-3xl font-bold theme-text">Check Your Email</h2>
                            <p className="theme-muted text-base">
                                If an account exists with <span className="font-semibold theme-text">{email}</span>, 
                                you will receive a password reset link shortly.
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="glass-card border-2 border-accent/20 rounded-xl p-4 mb-6">
                            <p className="text-sm theme-muted text-center">
                                The reset link will expire in <strong className="theme-text">10 minutes</strong>. 
                                If you don't see the email, check your spam folder.
                            </p>
                        </div>

                        {/* Back to Login */}
                        <Link 
                            to="/login" 
                            className="w-full btn-theme ripple py-3.5 rounded text-base font-semibold focus-ring flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Login
                        </Link>

                        {/* Resend Option */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setSuccess(false)}
                                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                            >
                                Didn't receive the email? Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show forgot password form
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
                            <Mail className="w-10 h-10 text-accent" />
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold theme-text mb-2">
                        Forgot Password?
                    </h1>
                    <p className="text-base theme-muted">
                        No worries! Enter your email and we'll send you a reset link
                    </p>
                </div>

                {/* Forgot Password Form */}
                <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-border animate-pop">
                    {error && <Alert type="error" message={error} />}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium theme-text mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full px-4 py-3 theme-surface border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent theme-text transition-all duration-300"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-theme ripple py-3.5 rounded text-base font-semibold focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm theme-muted">
                            Remember your password?{' '}
                            <Link 
                                to="/login" 
                                className="text-accent hover:text-accent/80 font-semibold transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
