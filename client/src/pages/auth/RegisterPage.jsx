import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingButton } from '../../components/layout/Loading';
import { Alert } from '../../components/layout/Alert';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import AuthWatermarkBackground from '../../components/layout/AuthWatermarkBackground';

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
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false
    });
    const { register } = useAuth();
    const navigate = useNavigate();

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (password.length > 128) {
            errors.push('Password must be less than 128 characters');
        }
        if (!/(?=.*[a-z])/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/(?=.*\d)/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Update password requirements visual feedback
        if (name === 'password') {
            setPasswordRequirements({
                length: value.length >= 8,
                uppercase: /(?=.*[A-Z])/.test(value),
                lowercase: /(?=.*[a-z])/.test(value),
                number: /(?=.*\d)/.test(value)
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validate all fields
        const errors = [];
        
        // Name validation
        if (!formData.name.trim()) {
            errors.push('Name is required');
        } else if (formData.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        } else if (formData.name.trim().length > 50) {
            errors.push('Name must be less than 50 characters');
        } else if (!/^[a-zA-Z\s\-'\.]+$/.test(formData.name.trim())) {
            errors.push('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
        }
        
        // Email validation
        if (!formData.email.trim()) {
            errors.push('Email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            errors.push('Please enter a valid email address');
        }
        
        // Password validation
        if (!formData.password) {
            errors.push('Password is required');
        } else {
            const passwordErrors = validatePassword(formData.password);
            errors.push(...passwordErrors);
        }
        
        // Confirm password validation
        if (!formData.confirmPassword) {
            errors.push('Please confirm your password');
        } else if (formData.password !== formData.confirmPassword) {
            errors.push('Passwords do not match');
        }
        
        // Display validation errors
        if (errors.length > 0) {
            setError(errors[0]); // Show first error
            return;
        }

        setLoading(true);
        try {
            const result = await register(formData);
            
            // Check if email verification is required
            if (result.requiresVerification) {
                // Redirect to check email page
                navigate('/auth/check-email', {
                    state: { 
                        email: formData.email.trim().toLowerCase() 
                    }
                });
                return;
            }
            
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
        <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── MOBILE VIEW ONLY (block md:hidden) - Matching Screen 2 ──── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="block md:hidden w-full max-w-md mx-auto min-h-screen theme-bg relative px-5 pt-8 pb-10 flex flex-col justify-between overflow-x-hidden animate-fadeIn">
        <AuthWatermarkBackground />

        <div className="relative z-10 w-full">
          {/* Top Bar with Back Button */}
          <div className="flex items-center mb-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl border border-border theme-surface flex items-center justify-center text-main shadow-xs active:scale-95 transition-transform"
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Logo Badge + Brand Name */}
          <div className="flex flex-col items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-md shadow-cyan-500/25 flex items-center justify-center mb-2">
              <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-xs font-bold theme-text tracking-tight uppercase">VoteBooth</span>
          </div>

          {/* Heading & Subtitle */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-extrabold theme-text tracking-tight mb-1">
              Create Account
            </h1>
            <p className="text-xs theme-muted">
              Join thousands creating secure polls
            </p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} onClose={() => setError("")} />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold theme-text mb-1 block">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold theme-text mb-1 block">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold theme-text mb-1 block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:theme-text"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* 4-bar Password Strength Meter from Screen 2 */}
              {formData.password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 flex gap-1.5 h-1.5">
                    {[0, 1, 2, 3].map((idx) => {
                      const count = [
                        passwordRequirements.length,
                        passwordRequirements.uppercase,
                        passwordRequirements.lowercase,
                        passwordRequirements.number,
                      ].filter(Boolean).length;
                      const active = idx < count;
                      const color =
                        count <= 1
                          ? "bg-rose-500"
                          : count <= 2
                          ? "bg-amber-400"
                          : count === 3
                          ? "bg-sky-400"
                          : "bg-emerald-500";
                      return (
                        <div
                          key={idx}
                          className={`flex-1 rounded-full transition-all duration-300 ${
                            active ? color : "bg-border/60"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-500">
                    {[
                      passwordRequirements.length,
                      passwordRequirements.uppercase,
                      passwordRequirements.lowercase,
                      passwordRequirements.number,
                    ].filter(Boolean).length === 4
                      ? "Strong"
                      : [
                          passwordRequirements.length,
                          passwordRequirements.uppercase,
                          passwordRequirements.lowercase,
                          passwordRequirements.number,
                        ].filter(Boolean).length >= 2
                      ? "Medium"
                      : "Weak"}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-bold theme-text mb-1 block">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border theme-surface theme-text text-sm focus:outline-none focus:border-accent shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:theme-text"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Real-time Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="flex items-center gap-1.5 mt-1.5 px-0.5">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[11px] font-semibold text-emerald-500">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" strokeWidth={2.5} strokeLinecap="round" />
                        <line x1="6" y1="6" x2="18" y2="18" strokeWidth={2.5} strokeLinecap="round" />
                      </svg>
                      <span className="text-[11px] font-semibold text-rose-500">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="flex items-start gap-2 pt-1 text-xs">
              <input
                type="checkbox"
                name="terms-mobile"
                id="terms-mobile"
                required
                defaultChecked
                className="rounded border-border text-accent focus:ring-accent w-4 h-4 mt-0.5"
              />
              <label htmlFor="terms-mobile" className="theme-muted leading-tight">
                I agree to the{" "}
                <Link to="/terms" className="text-accent hover:underline font-semibold">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-accent hover:underline font-semibold">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Social Separator */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-border/80" />
            <span className="px-3 text-xs theme-muted">or</span>
            <div className="flex-1 border-t border-border/80" />
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton text="Continue with Google" />
        </div>

        {/* Footer Link */}
        <div className="relative z-10 text-center pt-6 text-xs theme-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-accent hover:underline">
            Sign in
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── DESKTOP VIEW ONLY (hidden md:block) - Preserved Desktop ─── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:block w-full">
        <div className="min-h-screen theme-bg flex items-center justify-center py-4 sm:py-8 px-4 relative overflow-hidden">
            {/* Floating orbs background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl float" style={{"--float-distance": "30px"}}></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{"--float-distance": "-40px", "--float-duration": "8s"}}></div>
            </div>
            
            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-8 animate-fadeIn">
                    <div className="flex justify-center mb-4">
                        <div className="glass-card p-4 rounded-2xl interactive-scale border-2 border-accent/20">
                            <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold theme-text mb-2">Create Account</h1>
                    <p className="text-base theme-muted">Join thousands creating secure polls</p>
                </div>
                
                <div className="glass-card rounded-2xl p-6 sm:p-8 border-2 border-border animate-pop">
                    {error && <Alert type="error" message={error} />}
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium theme-text mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 theme-surface border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent theme-text transition-all duration-300"
                                placeholder="Enter your full name"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium theme-text mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 theme-surface border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent theme-text transition-all duration-300"
                                placeholder="Enter your email"
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium theme-text mb-2">
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
                                    className="w-full px-4 py-3 pr-12 theme-surface border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent theme-text transition-all duration-300"
                                    placeholder="Create a strong password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center theme-muted hover:text-accent transition-colors"
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
                            {formData.password && (
                                <div className="mt-2">
                                    <p className="text-xs theme-muted mb-1.5">Password requirements:</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center space-x-1">
                                            {passwordRequirements.length ? (
                                                <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span className={passwordRequirements.length ? 'text-green-600' : 'text-red-500'} title="At least 8 characters">8+ chars</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            {passwordRequirements.uppercase ? (
                                                <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span className={passwordRequirements.uppercase ? 'text-green-600' : 'text-red-500'} title="Uppercase letter">A-Z</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            {passwordRequirements.lowercase ? (
                                                <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span className={passwordRequirements.lowercase ? 'text-green-600' : 'text-red-500'} title="Lowercase letter">a-z</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            {passwordRequirements.number ? (
                                                <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3 h-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            <span className={passwordRequirements.number ? 'text-green-600' : 'text-red-500'} title="Number">0-9</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium theme-text mb-2">
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
                                    className="w-full px-4 py-3 pr-12 theme-surface border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent theme-text transition-all duration-300"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center theme-muted hover:text-accent transition-colors"
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
                            {formData.confirmPassword && (
                                <div className="mt-1 flex items-center space-x-2">
                                    {formData.password === formData.confirmPassword ? (
                                        <>
                                            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-xs text-green-600">Passwords match</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-xs text-red-500">Passwords don't match</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-start sm:items-center">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="h-4 w-4 text-accent focus:ring-accent border-border rounded mt-1 sm:mt-0 flex-shrink-0"
                            />
                            <label htmlFor="terms" className="ml-2 block text-sm theme-text leading-relaxed">
                                I agree to the{' '}
                                <Link to="/terms" className="text-accent hover:text-accent/80 font-medium transition-colors">
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link to="/privacy" className="text-accent hover:text-accent/80 font-medium transition-colors">
                                    Privacy Policy
                                </Link>
                            </label>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-theme ripple py-3.5 rounded-xl text-base font-semibold focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>
                    
                    {/* Social Login */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 glass-card theme-muted font-medium">or</span>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <GoogleSignInButton text="Continue with Google" />
                        </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm theme-muted">
                            Already have an account?{' '}
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
        </div>
        </>
    );
};

export default Register;