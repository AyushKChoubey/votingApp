import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Alert } from '../layout/Alert';
import { Loading } from '../layout/Loading';

export function CreateBooth() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        maxMembers: '50',
        settings: {
            resultsVisibleToVoters: true,
            allowVoteChange: false,
            requireRegistration: true
        }
    });
    const [candidates, setCandidates] = useState([{ name: '', description: '' }, { name: '', description: '' }]);
    const [canCreate, setCanCreate] = useState(false);
    const [maxBooths, setMaxBooths] = useState(5);
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
            const response = await api.get('/booth/api/create/check');
            const { canCreate, maxBooths } = response.data.data;
            setCanCreate(canCreate);
            setMaxBooths(maxBooths);
        } catch (err) {
            setError('Failed to check creation permissions');
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
                    [settingName]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleCandidateChange = (index, field, value) => {
        const updatedCandidates = [...candidates];
        updatedCandidates[index] = {
            ...updatedCandidates[index],
            [field]: value
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

        // Validate candidates
        const validCandidates = candidates.filter(c => c.name.trim());
        if (validCandidates.length < 2) {
            setError('At least 2 candidates are required');
            setLoading(false);
            return;
        }

        try {
            const submitData = {
                ...formData,
                candidates: validCandidates
            };

            const response = await api.post('/booth/api/create', submitData);
            setSuccess('Booth created successfully!');
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create booth');
        } finally {
            setLoading(false);
        }
    };

    if (checkingPermissions) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <Loading size="lg" color="white" />
                    <p className="text-white mt-4 text-lg">Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (!canCreate) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-white mb-4">Booth Limit Reached</h2>
                        <p className="text-gray-300 mb-6">
                            You've reached your limit of {maxBooths} booths. Upgrade your account to create more booths.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Create New Booth</h1>
                    <p className="text-gray-300 text-lg">Set up a new voting booth for your community</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    {error && <Alert type="error" message={error} />}
                    {success && <Alert type="success" message={success} />}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">
                                Basic Information
                            </h2>
                            
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                                    Booth Name *
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                    placeholder="Enter booth name (e.g., 'Student Council Election 2024')"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                                    placeholder="Describe the purpose and details of this voting booth..."
                                />
                            </div>

                            <div>
                                <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-200 mb-2">
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
                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Candidates */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-semibold text-white">Candidates</h2>
                                <button
                                    type="button"
                                    onClick={addCandidate}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                >
                                    Add Candidate
                                </button>
                            </div>

                            {candidates.map((candidate, index) => (
                                <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-white">Candidate {index + 1}</h3>
                                        {candidates.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeCandidate(index)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={candidate.name}
                                                onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                                placeholder="Candidate name"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Description
                                            </label>
                                            <input
                                                type="text"
                                                value={candidate.description}
                                                onChange={(e) => handleCandidateChange(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                                                placeholder="Brief description (optional)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Settings */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">
                                Booth Settings
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start space-x-3">
                                    <input
                                        id="resultsVisibleToVoters"
                                        name="settings.resultsVisibleToVoters"
                                        type="checkbox"
                                        checked={formData.settings.resultsVisibleToVoters}
                                        onChange={handleInputChange}
                                        className="mt-1 h-4 w-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                                    />
                                    <div>
                                        <label htmlFor="resultsVisibleToVoters" className="text-sm font-medium text-white">
                                            Results visible to voters
                                        </label>
                                        <p className="text-sm text-gray-300">Allow voters to see results after voting</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <input
                                        id="allowVoteChange"
                                        name="settings.allowVoteChange"
                                        type="checkbox"
                                        checked={formData.settings.allowVoteChange}
                                        onChange={handleInputChange}
                                        className="mt-1 h-4 w-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                                    />
                                    <div>
                                        <label htmlFor="allowVoteChange" className="text-sm font-medium text-white">
                                            Allow vote changes
                                        </label>
                                        <p className="text-sm text-gray-300">Let users change their vote</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/20"
                            >
                                Cancel
                            </button>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                            >
                                {loading ? <Loading size="sm" color="white" /> : 'Create Booth'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}