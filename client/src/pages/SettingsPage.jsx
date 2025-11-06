import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingButton, PageLoading } from '../components/layout/Loading';
import { useToast } from '../components/layout/Toast';
import BackButton from '../components/layout/BackButton';
import api from '../services/api';

const SettingsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(true);
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false
    });

    // Account deletion state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfileData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchProfileData = async () => {
        try {
            const response = await api.get('/api/user/profile');
            // API interceptor returns response.data directly, so response = { success: true, user: {...}, stats: {...} }
            const userData = response.user || response;
            setProfileData(userData);
        } catch (err) {
            addToast('Failed to load profile data', 'error');
            console.error('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

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

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        const errors = [];
        
        // Validate current password
        if (!passwordForm.currentPassword.trim()) {
            errors.push('Current password is required');
        }
        
        // Validate new password
        if (!passwordForm.newPassword.trim()) {
            errors.push('New password is required');
        } else {
            const passwordErrors = validatePassword(passwordForm.newPassword);
            errors.push(...passwordErrors);
        }
        
        // Validate confirm password
        if (!passwordForm.confirmNewPassword.trim()) {
            errors.push('Please confirm your new password');
        } else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            errors.push('New passwords do not match');
        }
        
        // Check if new password is same as current
        if (passwordForm.currentPassword === passwordForm.newPassword) {
            errors.push('New password must be different from current password');
        }
        
        // Display validation errors
        if (errors.length > 0) {
            addToast(errors[0], 'error'); // Show first error
            return;
        }

        setPasswordLoading(true);

        try {
            await api.put('/api/user/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmNewPassword: passwordForm.confirmNewPassword
            });
            
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            });
            addToast('Password changed successfully!', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to change password', 'error');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword.trim()) {
            addToast('Please enter your password to confirm account deletion', 'error');
            return;
        }

        setDeleteLoading(true);

        try {
            await api.delete('/api/user/account', {
                data: { password: deletePassword }
            });
            
            logout();
            navigate('/', { replace: true });
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to delete account', 'error');
            setDeleteLoading(false);
        }
    };

    const handleRefreshToken = async () => {
        try {
            await api.post('/api/user/refresh-token');
            addToast('Token refreshed successfully!', 'success');
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to refresh token', 'error');
        }
    };

    if (loading) {
        return <PageLoading text="Loading settings..." />;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
                    <p className="text-gray-600">Please log in to access your account settings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-start mb-4">
                        <BackButton to="/dashboard" />
                    </div>
                    
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Manage your account security and preferences</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Account Information Card */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Account Information</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="font-medium text-gray-700">Name</div>
                                <div className="text-gray-900">{profileData?.name || 'Not set'}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="font-medium text-gray-700">Email</div>
                                <div className="text-gray-900">{profileData?.email || 'Not set'}</div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="font-medium text-gray-700">Last Login</div>
                                <div className="text-gray-900">
                                    {profileData?.lastLogin 
                                        ? new Date(profileData.lastLogin).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'Never'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Card */}
                    {profileData?.authProvider !== 'google' && (
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => setPasswordOpen(prev => !prev)}
                                    aria-expanded={passwordOpen}
                                    className="flex items-center gap-3 focus:outline-none"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Change Password</h2>
                                </button>
                                <button
                                    onClick={() => setPasswordOpen(prev => !prev)}
                                    aria-label={passwordOpen ? 'Collapse password section' : 'Expand password section'}
                                    className="p-1 rounded-md hover:bg-gray-100"
                                >
                                    <svg className={`w-4 h-4 transform transition-transform ${passwordOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {passwordOpen && (
                                <>
                                    <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">
                                        Keep your account secure by using a strong password with at least 8 characters, including uppercase, lowercase, and numbers.
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm(prev => ({
                                                    ...prev,
                                                    currentPassword: e.target.value
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setPasswordForm(prev => ({
                                                            ...prev,
                                                            newPassword: value
                                                        }));
                                                        // Update password requirements visual feedback
                                                        setPasswordRequirements({
                                                            length: value.length >= 8,
                                                            uppercase: /(?=.*[A-Z])/.test(value),
                                                            lowercase: /(?=.*[a-z])/.test(value),
                                                            number: /(?=.*\d)/.test(value)
                                                        });
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                                    minLength={8}
                                                    required
                                                />
                                                {passwordForm.newPassword && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-gray-500 mb-1">Password requirements:</p>
                                                        <div className="flex items-center space-x-4 text-xs">
                                                            <div className="flex items-center space-x-1">
                                                                {passwordRequirements.length ? (
                                                                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                                <span className={passwordRequirements.length ? 'text-green-600' : 'text-red-500'} title="At least 8 characters">8+ chars</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                {passwordRequirements.uppercase ? (
                                                                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                                <span className={passwordRequirements.uppercase ? 'text-green-600' : 'text-red-500'} title="Uppercase letter">A-Z</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                {passwordRequirements.lowercase ? (
                                                                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                                <span className={passwordRequirements.lowercase ? 'text-green-600' : 'text-red-500'} title="Lowercase letter">a-z</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                {passwordRequirements.number ? (
                                                                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={passwordForm.confirmNewPassword}
                                                    onChange={(e) => setPasswordForm(prev => ({
                                                        ...prev,
                                                        confirmNewPassword: e.target.value
                                                    }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                                    minLength={8}
                                                    required
                                                />
                                                {passwordForm.confirmNewPassword && (
                                                    <div className="mt-1 flex items-center space-x-2">
                                                        {passwordForm.newPassword === passwordForm.confirmNewPassword ? (
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
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <LoadingButton
                                                type="submit"
                                                loading={passwordLoading}
                                                variant="teal"
                                                className="px-6 py-2"
                                            >
                                                Update Password
                                            </LoadingButton>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    )}

                    {/* Google Account Notice */}
                    {profileData?.authProvider === 'google' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">Google Account</h3>
                                    <p className="mt-1 text-sm text-blue-700">
                                        You're signed in with Google. Password changes are managed through your Google account.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Actions Card */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Security</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Refresh Authentication Token</h3>
                                    <p className="text-xs text-gray-500">Generate a new authentication token for enhanced security</p>
                                </div>
                                <button
                                    onClick={handleRefreshToken}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm"
                                >
                                    Refresh Token
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Last Password Change</h3>
                                    <p className="text-xs text-gray-500">
                                        {profileData?.passwordChangedAt 
                                            ? new Date(profileData.passwordChangedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : 'Never changed'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Login Attempts</h3>
                                    <p className="text-xs text-gray-500">Recent failed login attempts: {profileData?.loginAttempts || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border-l-4 border-red-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-red-600">Danger Zone</h2>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700">Delete Account</h3>
                                <p className="text-xs text-gray-500">Permanently delete your account and all associated data</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>

                {/* Delete Account Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-md w-full">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-red-600">Delete Account</h3>
                            </div>
                            <div className="px-6 py-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    This action cannot be undone. This will permanently delete your account and remove all associated data.
                                </p>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm your password to continue:
                                    </label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Enter your password"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setDeletePassword('');
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <LoadingButton
                                        onClick={handleDeleteAccount}
                                        loading={deleteLoading}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                                    >
                                        Delete Account
                                    </LoadingButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
