import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Alert } from '../layout/Alert';
import { LoadingButton, PageLoading } from '../layout/Loading';
import BackButton from '../layout/BackButton';

export function CreateBooth() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxMembers: 50,
        settings: {
            resultsVisibleToVoters: true,
            anonymousVoting: false,
            allowVoteChange: false,
            showLiveResults: false,
            requireEmailVerification: false,
            requireApproval: false,
            sendNotifications: true,
            votingStartTime: '',
            votingEndTime: '',
            allowedEmailDomains: []
        }
    });
    const [candidates, setCandidates] = useState([{ name: '', description: '' }, { name: '', description: '' }]);
    const [canCreate, setCanCreate] = useState(false);
    const [maxBooths, setMaxBooths] = useState(5);
    const [currentBooths, setCurrentBooths] = useState(0);
    const [loading, setLoading] = useState(false);
    const [checkingPermissions, setCheckingPermissions] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const navigate = useNavigate();

    useEffect(() => {
        checkCreatePermissions();
    }, []);

    const checkCreatePermissions = async () => {
        try {
            // Check if user has a token first
            const token = localStorage.getItem('token');
            if (!token) {
                setCanCreate(false);
                setError('Please log in to create booths');
                setCheckingPermissions(false);
                return;
            }

            const response = await api.get('/api/user/profile');
            
            if (response.success && response.user) {
                const user = response.user;
                const userMaxBooths = user.subscription?.maxBooths || 5;
                const userCurrentBooths = user.createdBooths?.length || 0;
                
                setCanCreate(userCurrentBooths < userMaxBooths);
                setMaxBooths(userMaxBooths);
                setCurrentBooths(userCurrentBooths);
            } else if (response.user) {
                // Handle case where response doesn't have success field but has user
                const user = response.user || response;
                const userMaxBooths = user.subscription?.maxBooths || 5;
                const userCurrentBooths = user.createdBooths?.length || 0;
                
                setCanCreate(userCurrentBooths < userMaxBooths);
                setMaxBooths(userMaxBooths);
                setCurrentBooths(userCurrentBooths);
            } else {
                setCanCreate(false);
                setError('Unable to verify permissions');
            }
        } catch (err) {
            console.error('Permission check error:', err);
            if (err.status === 401) {
                setError('Please log in to create booths');
                // Optionally redirect to login
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError('Failed to check permissions. Please try again.');
            }
            setCanCreate(false);
        } finally {
            setCheckingPermissions(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.startsWith('settings.')) {
            const settingName = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    [settingName]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
            }));
        }
    };

    const handleCandidateChange = (index, field, value) => {
        const updatedCandidates = [...candidates];
        updatedCandidates[index] = {
            ...updatedCandidates[index],
            [field]: value.trim()
        };
        setCandidates(updatedCandidates);
    };

    const addCandidate = () => {
        setCandidates([...candidates, { name: '', description: '' }]);
    };

    const removeCandidate = (index) => {
        if (candidates.length > 2) {
            const updatedCandidates = candidates.filter((_, i) => i !== index);
            setCandidates(updatedCandidates);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Check authentication before submitting
        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please log in to create booths');
            setLoading(false);
            return;
        }

        // Client-side validation
        const errors = [];

        // Validate booth name
        if (!formData.name.trim() || formData.name.trim().length < 3 || formData.name.trim().length > 100) {
            errors.push('Booth name must be 3-100 characters');
        }

        // Validate description
        if (!formData.description.trim() || formData.description.trim().length < 5 || formData.description.trim().length > 500) {
            errors.push('Description must be 5-500 characters');
        }

        // Validate max members
        if (!formData.maxMembers || formData.maxMembers < 2 || formData.maxMembers > 10000) {
            errors.push('Maximum members must be between 2 and 10,000');
        }

        // Validate candidates
        const validCandidates = candidates.filter(c => c.name.trim());
        if (validCandidates.length < 2) {
            errors.push('At least 2 candidates are required');
        }

        // Check for duplicate candidate names
        const candidateNames = validCandidates.map(c => c.name.trim().toLowerCase());
        if (new Set(candidateNames).size !== candidateNames.length) {
            errors.push('Candidate names must be unique');
        }

        // Validate time settings if provided
        if (formData.settings.votingStartTime && formData.settings.votingEndTime) {
            const startTime = new Date(formData.settings.votingStartTime);
            const endTime = new Date(formData.settings.votingEndTime);
            if (startTime >= endTime) {
                errors.push('Voting end time must be after start time');
            }
        }

        if (errors.length > 0) {
            setError(errors.join('. '));
            setLoading(false);
            return;
        }

        try {
            // Prepare submission data
            const submitData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                maxMembers: formData.maxMembers,
                candidates: validCandidates.map(c => ({
                    name: c.name.trim(),
                    description: c.description.trim()
                })),
                settings: {
                    ...formData.settings,
                    // Convert date strings to Date objects if they exist
                    votingStartTime: formData.settings.votingStartTime ? new Date(formData.settings.votingStartTime) : null,
                    votingEndTime: formData.settings.votingEndTime ? new Date(formData.settings.votingEndTime) : null
                }
            };

            const response = await api.post('/api/booth/create', submitData);
            
            if (response.success) {
                const successMessage = `Booth created successfully! Invite code: ${response.booth.inviteCode}`;
                setSuccess(successMessage);
                
                // Also update the booth count immediately
                setCurrentBooths(prev => prev + 1);
                setCanCreate(currentBooths < maxBooths - 1);
                
                // Navigate to the newly created booth
                setTimeout(() => {
                    if (response.booth.id) {
                        navigate(`/booth/${response.booth.id}`);
                    } else {
                        // Force dashboard refresh by adding state
                        navigate('/dashboard', { state: { refresh: true } });
                    }
                }, 2000);
            } else {
                console.error('Unexpected response format:', response);
                setError(response.error || 'Failed to create booth. Please try again.');
            }
        } catch (err) {
            console.error('Create booth error:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.status
            });
            setError(err.message || 'Failed to create booth. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (checkingPermissions) {
        return <PageLoading text="Checking permissions..." />;
    }

    if (!canCreate) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 backdrop-blur-sm transition-all duration-300 hover:shadow-3xl">
                        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Booth Limit Reached</h2>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-teal-600 mb-1">{currentBooths}/{maxBooths}</div>
                                <div className="text-sm text-gray-600">Booths Created</div>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            You've reached your limit of {maxBooths} booths. Upgrade your account to create more booths.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
            {/* Back Button */}
            <div className="max-w-4xl mx-auto mb-6">
                <BackButton to="/dashboard">Back to Dashboard</BackButton>
            </div>
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-4 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">Create New Booth</h1>
                    <p className="text-gray-600 text-sm sm:text-lg mb-4 sm:mb-6 px-2">Set up a new voting booth for your community</p>
                    
                    {/* Booth Statistics */}
                    <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2 sm:gap-4 justify-center items-center">
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 border border-teal-200">
                            <div className="text-lg sm:text-2xl font-bold text-teal-600">{currentBooths}/{maxBooths}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Created</div>
                        </div>
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 border border-green-200">
                            <div className="text-lg sm:text-2xl font-bold text-green-600">{maxBooths - currentBooths}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Remaining</div>
                        </div>
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 border border-blue-200">
                            <div className="text-lg sm:text-2xl font-bold text-blue-600">{Math.round((currentBooths/maxBooths) * 100)}%</div>
                            <div className="text-xs sm:text-sm text-gray-600">Usage</div>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="max-w-xs sm:max-w-md mx-auto mt-3 sm:mt-4">
                        <div className="bg-gray-200 rounded-full h-2 sm:h-3">
                            <div 
                                className="bg-gradient-to-r from-teal-500 to-green-500 h-2 sm:h-3 rounded-full transition-all duration-500"
                                style={{ width: `${(currentBooths/maxBooths) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                            {maxBooths - currentBooths} {maxBooths - currentBooths === 1 ? 'booth' : 'booths'} remaining
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-4 sm:p-8 border border-gray-100 backdrop-blur-sm transition-all duration-300 hover:shadow-3xl">
                    {error && <Alert type="error" message={error} />}
                    {success && <Alert type="success" message={success} />}

                    {/* Form Completion Status */}
                    {/* <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">Form Completion Status</h3>
                        <div className="space-y-1 text-xs sm:text-sm">
                            <div className={`flex items-center ${formData.name.trim().length >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                                <span className="mr-2 text-sm">{formData.name.trim().length >= 3 ? '✅' : '⭕'}</span>
                                <span className="truncate">Booth name ({formData.name.trim().length >= 3 ? 'Complete' : 'Required'})</span>
                            </div>
                            <div className={`flex items-center ${formData.description.trim().length >= 5 ? 'text-green-600' : 'text-gray-500'}`}>
                                <span className="mr-2 text-sm">{formData.description.trim().length >= 5 ? '✅' : '⭕'}</span>
                                <span className="truncate">Description ({formData.description.trim().length >= 5 ? 'Complete' : 'Required'})</span>
                            </div>
                            <div className={`flex items-center ${candidates.filter(c => c.name.trim()).length >= 2 ? 'text-green-600' : 'text-gray-500'}`}>
                                <span className="mr-2 text-sm">{candidates.filter(c => c.name.trim()).length >= 2 ? '✅' : '⭕'}</span>
                                <span className="truncate">Candidates ({candidates.filter(c => c.name.trim()).length}/2 minimum)</span>
                            </div>
                        </div>
                    </div> */}

                    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                        {/* Basic Information */}
                        <div className="space-y-4 sm:space-y-6">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                Basic Information
                            </h2>
                            
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Booth Name *
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                                        formData.name.trim().length > 0 && (formData.name.trim().length < 3 || formData.name.trim().length > 100)
                                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                            : 'border-gray-300 focus:ring-teal-500'
                                    }`}
                                    placeholder="Enter booth name (e.g., 'Student Council Election 2024')"
                                />
                                {formData.name.trim().length > 0 && formData.name.trim().length < 3 && (
                                    <p className="text-red-500 text-sm mt-1">Booth name must be at least 3 characters long</p>
                                )}
                                {formData.name.trim().length > 100 && (
                                    <p className="text-red-500 text-sm mt-1">Booth name must be less than 100 characters</p>
                                )}
                                <p className="text-gray-500 text-sm mt-1">{formData.name.length}/100 characters</p>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 resize-none text-sm sm:text-base ${
                                        formData.description.trim().length > 0 && (formData.description.trim().length < 10 || formData.description.trim().length > 500)
                                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                            : 'border-gray-300 focus:ring-teal-500'
                                    }`}
                                    placeholder="Describe the purpose and details of this voting booth..."
                                />
                                {formData.description.trim().length > 0 && formData.description.trim().length < 5 && (
                                    <p className="text-red-500 text-sm mt-1">Description must be at least 5 characters long</p>
                                )}
                                {formData.description.trim().length > 500 && (
                                    <p className="text-red-500 text-sm mt-1">Description must be less than 500 characters</p>
                                )}
                                <p className="text-gray-500 text-sm mt-1">{formData.description.length}/500 characters</p>
                            </div>

                            <div>
                                <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Members
                                </label>
                                <input
                                    id="maxMembers"
                                    name="maxMembers"
                                    type="number"
                                    min="2"
                                    max="10000"
                                    value={formData.maxMembers}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-sm sm:text-base ${
                                        formData.maxMembers && (formData.maxMembers < 2 || formData.maxMembers > 10000)
                                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                            : 'border-gray-300 focus:ring-teal-500'
                                    }`}
                                    placeholder="50"
                                />
                                {formData.maxMembers && formData.maxMembers < 2 && (
                                    <p className="text-red-500 text-sm mt-1">Must be at least 2 members</p>
                                )}
                                {formData.maxMembers && formData.maxMembers > 10000 && (
                                    <p className="text-red-500 text-sm mt-1">Cannot exceed 10,000 members</p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">Number of people who can join this booth (2-10,000)</p>
                            </div>
                        </div>

                        {/* Candidates */}
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Candidates</h2>
                                <button
                                    type="button"
                                    onClick={addCandidate}
                                    className="bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm font-semibold w-full sm:w-auto"
                                >
                                    Add Candidate
                                </button>
                            </div>

                            {candidates.map((candidate, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Candidate {index + 1}</h3>
                                        {candidates.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeCandidate(index)}
                                                className="text-red-500 hover:text-red-600 transition-colors transform hover:scale-110 p-1"
                                            >
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={candidate.name}
                                                onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 text-sm sm:text-base ${
                                                    candidate.name.trim().length > 0 && candidate.name.trim().length < 1
                                                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                        : 'border-gray-300 focus:ring-teal-500'
                                                }`}
                                                placeholder="Enter candidate name"
                                            />
                                            {candidate.name.trim().length === 0 && index < 2 && (
                                                <p className="text-orange-500 text-xs sm:text-sm mt-1">This candidate is required</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                value={candidate.description}
                                                onChange={(e) => handleCandidateChange(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300 text-sm sm:text-base"
                                                placeholder="Brief description (optional)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Settings */}
                        <div className="space-y-4 sm:space-y-6">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                                Booth Settings
                            </h2>
                            
                            {/* Voting Rules */}
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900">Voting Rules</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="flex items-start space-x-3">
                                        <input
                                            id="resultsVisibleToVoters"
                                            name="settings.resultsVisibleToVoters"
                                            type="checkbox"
                                            checked={formData.settings.resultsVisibleToVoters}
                                            onChange={handleInputChange}
                                            className="mt-1 h-4 w-4 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500"
                                        />
                                        <div>
                                            <label htmlFor="resultsVisibleToVoters" className="text-sm font-medium text-gray-900">
                                                Results visible to voters
                                            </label>
                                            <p className="text-sm text-gray-600">Allow voters to see results after voting</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <input
                                            id="allowVoteChange"
                                            name="settings.allowVoteChange"
                                            type="checkbox"
                                            checked={formData.settings.allowVoteChange}
                                            onChange={handleInputChange}
                                            className="mt-1 h-4 w-4 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500"
                                        />
                                        <div>
                                            <label htmlFor="anonymousVoting" className="text-sm font-medium text-gray-900">
                                                Anonymous voting
                                            </label>
                                            <p className="text-sm text-gray-600">Hide voter identities from results</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Access Control */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900">Access Control</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-start space-x-3">
                                        <input
                                            id="requireEmailVerification"
                                            name="settings.requireEmailVerification"
                                            type="checkbox"
                                            checked={formData.settings.requireEmailVerification}
                                            onChange={handleInputChange}
                                            className="mt-1 h-4 w-4 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500"
                                        />
                                        <div>
                                            <label htmlFor="requireEmailVerification" className="text-sm font-medium text-gray-900">
                                                Require email verification
                                            </label>
                                            <p className="text-sm text-gray-600">Users must verify their email to vote</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <input
                                            id="requireApproval"
                                            name="settings.requireApproval"
                                            type="checkbox"
                                            checked={formData.settings.requireApproval}
                                            onChange={handleInputChange}
                                            className="mt-1 h-4 w-4 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500"
                                        />
                                        <div>
                                            <label htmlFor="requireApproval" className="text-sm font-medium text-gray-900">
                                                Require approval
                                            </label>
                                            <p className="text-sm text-gray-600">Manually approve new members</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Time Settings */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900">Voting Schedule (Optional)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="votingStartTime" className="block text-sm font-medium text-gray-700 mb-2">
                                            Voting Start Time
                                        </label>
                                        <input
                                            id="votingStartTime"
                                            name="settings.votingStartTime"
                                            type="datetime-local"
                                            value={formData.settings.votingStartTime}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="votingEndTime" className="block text-sm font-medium text-gray-700 mb-2">
                                            Voting End Time
                                        </label>
                                        <input
                                            id="votingEndTime"
                                            name="settings.votingEndTime"
                                            type="datetime-local"
                                            value={formData.settings.votingEndTime}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-all duration-300 border border-gray-300 font-semibold text-sm sm:text-base"
                            >
                                Cancel
                            </button>
                            
                            <LoadingButton
                                type="submit"
                                loading={loading || checkingPermissions}
                                disabled={
                                    formData.name.trim().length < 3 || 
                                    formData.description.trim().length < 10 || 
                                    candidates.filter(c => c.name.trim()).length < 2
                                }
                                variant="teal"
                                size="lg"
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base"
                            >
                                {formData.name.trim().length >= 3 && 
                                formData.description.trim().length >= 10 && 
                                candidates.filter(c => c.name.trim()).length >= 2
                                    ? 'Create Booth'
                                    : 'Complete Required Fields'}
                            </LoadingButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}