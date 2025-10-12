import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingButton, PageLoading } from '../components/layout/Loading';
import { Alert } from '../components/layout/Alert';
import BackButton from '../components/layout/BackButton';
import api from '../services/api';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: '',
        age: '',
        profile: {
            bio: '',
            organization: '',
            website: '',
            timezone: 'UTC'
        }
    });
    const [updateLoading, setUpdateLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            fetchProfileData();
            fetchUserStats();
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
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                mobile: userData.mobile || '',
                address: userData.address || '',
                age: userData.age || '',
                profile: {
                    bio: userData.profile?.bio || '',
                    organization: userData.profile?.organization || '',
                    website: userData.profile?.website || '',
                    timezone: userData.profile?.timezone || 'UTC'
                }
            });
        } catch (err) {
            setError('Failed to load profile data');
            console.error('Profile fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const response = await api.get('/api/user/stats');
            // API interceptor returns response.data directly
            setUserStats(response);
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdateLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.put('/api/user/profile', formData);
            // API interceptor returns response.data directly
            const userData = response.user || response;
            setProfileData(userData);
            setSuccess('Profile updated successfully!');
            setEditing(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setUpdateLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return <PageLoading text="Loading your profile..." />;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
                    <p className="text-gray-600">Please log in to view your profile.</p>
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {profileData?.profilePicture ? (
                                    <img
                                        src={profileData.profilePicture}
                                        alt="Profile"
                                        className="h-16 w-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-teal-600 flex items-center justify-center">
                                        <span className="text-2xl font-semibold text-white">
                                            {profileData?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{profileData?.name}</h1>
                                    <p className="text-gray-600">{profileData?.email}</p>
                                    <div className="flex items-center space-x-4 mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            profileData?.isEmailVerified 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {profileData?.isEmailVerified ? 'Verified' : 'Unverified'}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                            {profileData?.role?.charAt(0)?.toUpperCase() + profileData?.role?.slice(1)}
                                        </span>
                                        {profileData?.authProvider === 'google' && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Google Account
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors duration-200"
                            >
                                {editing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alert Messages */}
                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Information */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                            </div>
                            <div className="px-6 py-4">
                                {editing ? (
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Mobile Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="mobile"
                                                    value={formData.mobile}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Age
                                                </label>
                                                <input
                                                    type="number"
                                                    name="age"
                                                    value={formData.age}
                                                    onChange={handleInputChange}
                                                    min="13"
                                                    max="150"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Address
                                            </label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bio
                                            </label>
                                            <textarea
                                                name="profile.bio"
                                                value={formData.profile.bio}
                                                onChange={handleInputChange}
                                                rows={3}
                                                maxLength={500}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                placeholder="Tell us about yourself..."
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                {formData.profile.bio.length}/500 characters
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Organization
                                                </label>
                                                <input
                                                    type="text"
                                                    name="profile.organization"
                                                    value={formData.profile.organization}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Website
                                                </label>
                                                <input
                                                    type="url"
                                                    name="profile.website"
                                                    value={formData.profile.website}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setEditing(false)}
                                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                            >
                                                Cancel
                                            </button>
                                            <LoadingButton
                                                type="submit"
                                                loading={updateLoading}
                                                variant="teal"
                                                className="px-4 py-2"
                                            >
                                                Save Changes
                                            </LoadingButton>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
                                                <p className="text-sm text-gray-900">{profileData?.mobile || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500">Age</h3>
                                                <p className="text-sm text-gray-900">{profileData?.age || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Address</h3>
                                            <p className="text-sm text-gray-900">{profileData?.address || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                                            <p className="text-sm text-gray-900">{profileData?.profile?.bio || 'Not provided'}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500">Organization</h3>
                                                <p className="text-sm text-gray-900">{profileData?.profile?.organization || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-500">Website</h3>
                                                {profileData?.profile?.website ? (
                                                    <a 
                                                        href={profileData.profile.website} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-teal-600 hover:text-teal-700"
                                                    >
                                                        {profileData.profile.website}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-gray-900">Not provided</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Account Stats */}
                        {userStats && (
                            <div className="bg-white rounded-lg shadow-md">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Account Statistics</h2>
                                </div>
                                <div className="px-6 py-4 space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Booths Created</span>
                                        <span className="text-sm font-medium text-gray-900">{userStats.boothsCreated || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Booths Joined</span>
                                        <span className="text-sm font-medium text-gray-900">{userStats.boothsJoined || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Total Votes</span>
                                        <span className="text-sm font-medium text-gray-900">{userStats.totalVotes || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Login Count</span>
                                        <span className="text-sm font-medium text-gray-900">{profileData?.loginCount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Information */}
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                                    <p className="text-sm text-gray-900">{formatDate(profileData?.createdAt)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Last Login</h3>
                                    <p className="text-sm text-gray-900">{formatDate(profileData?.lastLogin)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Account Status</h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        profileData?.isActive 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {profileData?.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Authentication Provider</h3>
                                    <p className="text-sm text-gray-900 capitalize">{profileData?.authProvider || 'Local'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
