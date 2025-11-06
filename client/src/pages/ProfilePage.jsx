import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoadingButton, PageLoading } from '../components/layout/Loading';
import { useToast } from '../components/layout/Toast';
import BackButton from '../components/layout/BackButton';
import api from '../services/api';

const ProfilePage = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [profileData, setProfileData] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        profile: {
            bio: '',
            organization: '',
            website: ''
        }
    });
    const [updateLoading, setUpdateLoading] = useState(false);
    const [profileOpen, setProfileOpen] = useState(true);

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
                profile: {
                    bio: userData.profile?.bio || '',
                    organization: userData.profile?.organization || '',
                    website: userData.profile?.website || ''
                }
            });
        } catch (err) {
            addToast('Failed to load profile data', 'error');
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

    const [fieldErrors, setFieldErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Update form data
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
        
        // Real-time validation
        let errors = [];
        
        switch (name) {
            case 'name':
                errors = validateName(value);
                break;
            case 'mobile':
                errors = validateMobile(value);
                break;
            case 'profile.organization':
                errors = validateOrganization(value);
                break;
            case 'profile.website':
                errors = validateWebsite(value);
                break;
            case 'profile.bio':
                errors = validateBio(value);
                break;
            default:
                break;
        }
        
        // Update field errors
        setFieldErrors(prev => ({
            ...prev,
            [name]: errors.length > 0 ? errors[0] : null
        }));
    };

    const validateName = (name) => {
        const errors = [];
        if (!name || name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }
        if (name && name.trim().length > 50) {
            errors.push('Name must be less than 50 characters');
        }
        if (name && !/^[a-zA-Z\s\-'\.]+$/.test(name.trim())) {
            errors.push('Name can only contain letters, spaces, hyphens, apostrophes, and periods');
        }
        return errors;
    };

    const validateMobile = (mobile) => {
        const errors = [];
        if (mobile && !/^\+?[\d\s\-\(\)]+$/.test(mobile)) {
            errors.push('Please provide a valid mobile number');
        }
        if (mobile && mobile.length > 20) {
            errors.push('Mobile number is too long');
        }
        return errors;
    };

    const validateWebsite = (website) => {
        const errors = [];
        if (website && !/^https?:\/\/.+\..+/.test(website)) {
            errors.push('Please provide a valid website URL (must start with http:// or https://)');
        }
        if (website && website.length > 255) {
            errors.push('Website URL is too long');
        }
        return errors;
    };

    const validateOrganization = (organization) => {
        const errors = [];
        if (organization && organization.length > 100) {
            errors.push('Organization name must be less than 100 characters');
        }
        return errors;
    };

    const validateBio = (bio) => {
        const errors = [];
        if (bio && bio.length > 500) {
            errors.push('Bio must be less than 500 characters');
        }
        return errors;
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        // Comprehensive validation
        const errors = [];
        
        // Validate name (required)
        const nameErrors = validateName(formData.name);
        errors.push(...nameErrors);
        
        // Validate mobile (optional)
        if (formData.mobile) {
            const mobileErrors = validateMobile(formData.mobile);
            errors.push(...mobileErrors);
        }
        
        // Validate organization (optional)
        if (formData.profile.organization) {
            const orgErrors = validateOrganization(formData.profile.organization);
            errors.push(...orgErrors);
        }
        
        // Validate website (optional)
        if (formData.profile.website) {
            const websiteErrors = validateWebsite(formData.profile.website);
            errors.push(...websiteErrors);
        }
        
        // Validate bio (optional)
        if (formData.profile.bio) {
            const bioErrors = validateBio(formData.profile.bio);
            errors.push(...bioErrors);
        }
        
        // Display validation errors
        if (errors.length > 0) {
            addToast(errors[0], 'error'); // Show first error
            return;
        }

        setUpdateLoading(true);

        try {
            // Don't send email in the update request to prevent changes
            const updateData = {
                name: formData.name.trim(),
                mobile: formData.mobile?.trim() || '',
                profile: {
                    bio: formData.profile.bio?.trim() || '',
                    organization: formData.profile.organization?.trim() || '',
                    website: formData.profile.website?.trim() || ''
                }
            };
            
            const response = await api.put('/api/user/profile', updateData);
            // API interceptor returns response.data directly
            const userData = response.user || response;
            setProfileData(userData);
            addToast('Profile updated successfully!', 'success');
            setEditing(false);
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to update profile', 'error');
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
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-start mb-4">
                        <BackButton to="/dashboard" />
                    </div>
                    
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Manage your personal information and preferences</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Profile Overview Card */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100">
                        <div className="flex items-center gap-4 mb-4">
                            {profileData?.profilePicture ? (
                                <img
                                    src={profileData.profilePicture}
                                    alt="Profile"
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                                    <span className="text-2xl font-semibold text-white">
                                        {profileData?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{profileData?.name}</h2>
                                <p className="text-gray-600 text-sm sm:text-base">{profileData?.email}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        profileData?.isEmailVerified 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {profileData?.isEmailVerified ? '✓ Verified' : '⚠ Unverified'}
                                    </span>
                                    {profileData?.authProvider === 'google' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Google Account
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 text-sm"
                            >
                                {editing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>
                    </div>

                    {/* Profile Information Card */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setProfileOpen(prev => !prev)}
                                aria-expanded={profileOpen}
                                className="flex items-center gap-3 focus:outline-none"
                            >
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Personal Information</h2>
                            </button>
                            <button
                                onClick={() => setProfileOpen(prev => !prev)}
                                aria-label={profileOpen ? 'Collapse profile section' : 'Expand profile section'}
                                className="p-1 rounded-md hover:bg-gray-100"
                            >
                                <svg className={`w-4 h-4 transform transition-transform ${profileOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {profileOpen && (
                            <>
                                {editing ? (
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Full Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                                                        fieldErrors.name 
                                                            ? 'border-red-300 focus:ring-red-500' 
                                                            : 'border-gray-300 focus:ring-teal-500'
                                                    }`}
                                                    required
                                                />
                                                {fieldErrors.name && (
                                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Email
                                                    <span className="ml-1 text-xs text-gray-500">(cannot be changed)</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
                                                    readOnly
                                                    disabled
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Email cannot be changed for security reasons. Contact support if you need to update your email.
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mobile Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="mobile"
                                                    value={formData.mobile}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                                                        fieldErrors.mobile 
                                                            ? 'border-red-300 focus:ring-red-500' 
                                                            : 'border-gray-300 focus:ring-teal-500'
                                                    }`}
                                                    placeholder="Optional"
                                                />
                                                {fieldErrors.mobile && (
                                                    <p className="text-xs text-red-600 mt-1">{fieldErrors.mobile}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Organization
                                                </label>
                                                <input
                                                    type="text"
                                                    name="profile.organization"
                                                    value={formData.profile.organization}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                                                        fieldErrors['profile.organization'] 
                                                            ? 'border-red-300 focus:ring-red-500' 
                                                            : 'border-gray-300 focus:ring-teal-500'
                                                    }`}
                                                    placeholder="Optional"
                                                />
                                                {fieldErrors['profile.organization'] && (
                                                    <p className="text-xs text-red-600 mt-1">{fieldErrors['profile.organization']}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Website
                                            </label>
                                            <input
                                                type="url"
                                                name="profile.website"
                                                value={formData.profile.website}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                                                    fieldErrors['profile.website'] 
                                                        ? 'border-red-300 focus:ring-red-500' 
                                                        : 'border-gray-300 focus:ring-teal-500'
                                                }`}
                                                placeholder="https://example.com (optional)"
                                            />
                                            {fieldErrors['profile.website'] && (
                                                <p className="text-xs text-red-600 mt-1">{fieldErrors['profile.website']}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Bio
                                            </label>
                                            <textarea
                                                name="profile.bio"
                                                value={formData.profile.bio}
                                                onChange={handleInputChange}
                                                rows={3}
                                                maxLength={500}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                                                    fieldErrors['profile.bio'] 
                                                        ? 'border-red-300 focus:ring-red-500' 
                                                        : 'border-gray-300 focus:ring-teal-500'
                                                }`}
                                                placeholder="Tell us about yourself... (optional)"
                                            />
                                            <div className="flex justify-between items-center mt-1">
                                                <div>
                                                    {fieldErrors['profile.bio'] && (
                                                        <p className="text-xs text-red-600">{fieldErrors['profile.bio']}</p>
                                                    )}
                                                </div>
                                                <p className={`text-sm ${formData.profile.bio.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                                                    {formData.profile.bio.length}/500 characters
                                                </p>
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
                                                className="px-6 py-2"
                                            >
                                                Save Changes
                                            </LoadingButton>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="font-medium text-gray-700">Mobile Number</div>
                                            <div className="text-gray-900">{profileData?.mobile || 'Not provided'}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="font-medium text-gray-700">Organization</div>
                                            <div className="text-gray-900">{profileData?.profile?.organization || 'Not provided'}</div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                                            <div className="font-medium text-gray-700">Website</div>
                                            {profileData?.profile?.website ? (
                                                <a 
                                                    href={profileData.profile.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-teal-600 hover:text-teal-700 break-all"
                                                >
                                                    {profileData.profile.website}
                                                </a>
                                            ) : (
                                                <div className="text-gray-900">Not provided</div>
                                            )}
                                        </div>
                                        {profileData?.profile?.bio && (
                                            <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                                                <div className="font-medium text-gray-700">Bio</div>
                                                <div className="text-gray-900">{profileData.profile.bio}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Statistics Card */}
                    {userStats && (
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Activity Overview</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="bg-teal-50 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-teal-600">{userStats.boothsCreated || 0}</div>
                                    <div className="text-gray-600">Created</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{userStats.boothsJoined || 0}</div>
                                    <div className="text-gray-600">Joined</div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-purple-600">{userStats.totalVotes || 0}</div>
                                    <div className="text-gray-600">Votes</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-green-600">{profileData?.loginCount || 0}</div>
                                    <div className="text-gray-600">Logins</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Details Card */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Account Details</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="font-medium text-gray-700">Member Since</div>
                                <div className="text-gray-900">{formatDate(profileData?.createdAt)}</div>
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
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
