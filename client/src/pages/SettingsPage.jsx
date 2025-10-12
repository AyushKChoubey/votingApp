import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingButton, PageLoading } from '../components/layout/Loading';
import { Alert } from '../components/layout/Alert';
import BackButton from '../components/layout/BackButton';
import api from '../services/api';

const SettingsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Preferences state
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        smsNotifications: false,
        marketing: false,
        reminders: true
    });
    const [preferencesLoading, setPreferencesLoading] = useState(false);

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
            
            // Set preferences from profile data
            if (userData.preferences) {
                setPreferences({
                    emailNotifications: userData.preferences.emailNotifications ?? true,
                    smsNotifications: userData.preferences.smsNotifications ?? false,
                    marketing: userData.preferences.marketing ?? false,
                    reminders: userData.preferences.reminders ?? true
                });
            }
        } catch (err) {
            setError('Failed to load profile data');
            console.error('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        setPasswordLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.put('/api/user/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setSuccess('Password changed successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handlePreferencesChange = async (key, value) => {
        const newPreferences = { ...preferences, [key]: value };
        setPreferences(newPreferences);
        setPreferencesLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.put('/api/user/preferences', newPreferences);
            setSuccess('Preferences updated successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            // Revert changes on error
            setPreferences(preferences);
            setError(err.response?.data?.error || 'Failed to update preferences');
        } finally {
            setPreferencesLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword.trim()) {
            setError('Please enter your password to confirm account deletion');
            return;
        }

        setDeleteLoading(true);
        setError('');

        try {
            await api.delete('/api/user/account', {
                data: { password: deletePassword }
            });
            
            logout();
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete account');
            setDeleteLoading(false);
        }
    };

    const handleRefreshToken = async () => {
        setError('');
        setSuccess('');

        try {
            await api.post('/api/user/refresh-token');
            setSuccess('Token refreshed successfully!');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to refresh token');
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <div className="mb-6">
                    <BackButton to="/dashboard">Back to Dashboard</BackButton>
                </div>

                {/* Header */}
                <div className="bg-white rounded-lg shadow-md mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                        <p className="text-gray-600">Manage your account security and preferences</p>
                    </div>
                </div>

                {/* Alert Messages */}
                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}

                <div className="space-y-6">
                    {/* Change Password */}
                    {profileData?.authProvider !== 'google' && (
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                                <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                            </div>
                            <div className="px-6 py-4">
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm(prev => ({
                                                ...prev,
                                                currentPassword: e.target.value
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm(prev => ({
                                                    ...prev,
                                                    newPassword: e.target.value
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm(prev => ({
                                                    ...prev,
                                                    confirmPassword: e.target.value
                                                }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                minLength={6}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <LoadingButton
                                            type="submit"
                                            loading={passwordLoading}
                                            variant="teal"
                                            className="px-4 py-2"
                                        >
                                            Change Password
                                        </LoadingButton>
                                    </div>
                                </form>
                            </div>
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

                    {/* Notification Preferences */}
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                            <p className="text-sm text-gray-600">Choose how you want to be notified</p>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
                                    <p className="text-sm text-gray-500">Receive voting updates and booth invitations via email</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications}
                                        onChange={(e) => handlePreferencesChange('emailNotifications', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={preferencesLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">SMS Notifications</h3>
                                    <p className="text-sm text-gray-500">Get text messages for urgent voting updates</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.smsNotifications}
                                        onChange={(e) => handlePreferencesChange('smsNotifications', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={preferencesLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Marketing Communications</h3>
                                    <p className="text-sm text-gray-500">Receive updates about new features and improvements</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.marketing}
                                        onChange={(e) => handlePreferencesChange('marketing', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={preferencesLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Voting Reminders</h3>
                                    <p className="text-sm text-gray-500">Get reminders about upcoming voting deadlines</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.reminders}
                                        onChange={(e) => handlePreferencesChange('reminders', e.target.checked)}
                                        className="sr-only peer"
                                        disabled={preferencesLoading}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Security Actions */}
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                            <p className="text-sm text-gray-600">Manage your account security settings</p>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Refresh Authentication Token</h3>
                                    <p className="text-sm text-gray-500">Generate a new authentication token for enhanced security</p>
                                </div>
                                <button
                                    onClick={handleRefreshToken}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Refresh Token
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Last Password Change</h3>
                                    <p className="text-sm text-gray-500">
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

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Login Attempts</h3>
                                    <p className="text-sm text-gray-500">Recent failed login attempts: {profileData?.loginAttempts || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-lg shadow-md border-l-4 border-red-500">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
                            <p className="text-sm text-gray-600">Irreversible and destructive actions</p>
                        </div>
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700">Delete Account</h3>
                                    <p className="text-sm text-gray-500">Permanently delete your account and all associated data</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                >
                                    Delete Account
                                </button>
                            </div>
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
                                            setError('');
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
