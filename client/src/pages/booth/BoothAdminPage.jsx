import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { boothService } from '../../services/api';
import { Alert } from '../../components/layout/Alert';
import { LoadingButton, PageLoading } from '../../components/layout/Loading';
import BackButton from '../../components/layout/BackButton';

const BoothAdminPage = () => {
    const { boothId } = useParams();
    const navigate = useNavigate();
    
    const [booth, setBooth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [settings, setSettings] = useState({});
    const [editingSettings, setEditingSettings] = useState(false);
    const [removingMembers, setRemovingMembers] = useState(new Set());

    useEffect(() => {
        fetchBoothDetails();
    }, [boothId]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 4000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error && booth) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error, booth]);

    const fetchBoothDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await boothService.getBooth(boothId);
            
            if (response.success && response.data) {
                setBooth(response.data.booth);
                setSettings(response.data.booth.settings || {});
                
                if (!response.data.permissions.isCreator) {
                    setError('You are not authorized to manage this booth');
                    return;
                }
            } else {
                setError(response.error || 'Failed to load booth details');
            }
        } catch (err) {
            console.error('Fetch booth details error:', err);
            if (err.status === 403) {
                setError('You are not authorized to access this booth');
            } else if (err.status === 404) {
                setError('Booth not found');
            } else {
                setError(err.message || 'Failed to load booth details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async () => {
        try {
            setUpdating(true);
            setError('');
            
            const response = await boothService.updateSettings(boothId, settings);
            
            if (response.success) {
                setSuccess('Settings updated successfully!');
                setEditingSettings(false);
                await fetchBoothDetails();
            } else {
                setError(response.error || 'Failed to update settings');
            }
        } catch (err) {
            console.error('Update settings error:', err);
            setError(err.message || 'Failed to update settings');
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = booth.status === 'active' ? 'closed' : 'active';
        const confirmMessage = `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'close'} this booth?`;
        
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setUpdating(true);
            setError('');
            
            const response = await boothService.toggleStatus(boothId);
            
            if (response.success) {
                setSuccess(`Booth ${newStatus === 'active' ? 'activated' : 'closed'} successfully!`);
                await fetchBoothDetails();
            } else {
                setError(response.error || 'Failed to toggle booth status');
            }
        } catch (err) {
            console.error('Toggle status error:', err);
            setError(err.message || 'Failed to toggle booth status');
        } finally {
            setUpdating(false);
        }
    };

    const handleResetInviteCode = async () => {
        if (!window.confirm('Are you sure you want to reset the invite code? The old code will no longer work.')) {
            return;
        }

        try {
            setUpdating(true);
            setError('');
            
            const response = await boothService.resetInviteCode(boothId);
            
            if (response.success) {
                setSuccess('Invite code reset successfully!');
                await fetchBoothDetails();
            } else {
                setError(response.error || 'Failed to reset invite code');
            }
        } catch (err) {
            console.error('Reset invite code error:', err);
            setError(err.message || 'Failed to reset invite code');
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this member from the booth?')) {
            return;
        }

        try {
            setRemovingMembers(prev => new Set(prev).add(memberId));
            setError('');
            
            const response = await boothService.removeMember(boothId, memberId);
            
            if (response.success) {
                setSuccess('Member removed successfully!');
                await fetchBoothDetails();
            } else {
                setError(response.error || 'Failed to remove member');
            }
        } catch (err) {
            console.error('Remove member error:', err);
            setError(err.message || 'Failed to remove member');
        } finally {
            setRemovingMembers(prev => {
                const newSet = new Set(prev);
                newSet.delete(memberId);
                return newSet;
            });
        }
    };

    const handleDeleteBooth = async () => {
        if (!window.confirm('⚠️ Are you sure you want to delete this booth? This action cannot be undone.')) {
            return;
        }

        const confirmText = window.prompt('Type "DELETE" in capital letters to confirm permanent deletion:');
        if (confirmText !== 'DELETE') {
            setError('Deletion cancelled. Please type "DELETE" exactly to confirm.');
            return;
        }

        try {
            setUpdating(true);
            setError('');
            
            const response = await boothService.deleteBooth(boothId);
            
            if (response.success) {
                setSuccess('Booth deleted successfully! Redirecting...');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                setError(response.error || 'Failed to delete booth');
            }
        } catch (err) {
            console.error('Delete booth error:', err);
            setError(err.message || 'Failed to delete booth');
        } finally {
            setUpdating(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const copyToClipboard = async (text, message) => {
        try {
            await navigator.clipboard.writeText(text);
            setSuccess(message);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <PageLoading size="lg" color="teal" />
                    <p className="text-gray-700 mt-4 text-sm sm:text-base">Loading booth administration...</p>
                </div>
            </div>
        );
    }

    if (error && !booth) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
                        <p className="text-gray-600 text-sm sm:text-base mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 pb-4">
            {/* Header - Fixed on mobile */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <BackButton to={`/booth/${boothId}`} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group">
                            <span className="text-sm sm:text-base font-medium">Back to Booth</span>
                        </BackButton>
                        
                        {/* Status Toggle - Moved to header */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className={`text-xs sm:text-sm font-semibold ${
                                booth?.status === 'active' ? 'text-green-600' : 'text-gray-600'
                            }`}>
                                {booth?.status === 'active' ? 'Active' : 'Closed'}
                            </span>
                            <button
                                onClick={handleToggleStatus}
                                disabled={updating}
                                className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-14 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    booth?.status === 'active' 
                                        ? 'bg-green-600 focus:ring-green-500' 
                                        : 'bg-gray-400 focus:ring-gray-400'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                                    booth?.status === 'active' ? 'translate-x-6 sm:translate-x-8' : 'translate-x-1'
                                }`} />
                            </button>
                            <button
                                onClick={fetchBoothDetails}
                                className="p-1.5 sm:p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                                title="Refresh"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6">
                {/* Title Section */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                        {booth?.name}
                    </h1>
                    
                    {/* Quick Actions */}
                    <div className="flex flex-row gap-2 justify-center mt-4">
                        <button
                            onClick={() => navigate(`/booth/${boothId}`)}
                            className="flex-1 max-w-[150px] bg-white hover:bg-teal-50 text-teal-700 py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold border border-teal-200 hover:border-teal-300 transition-all shadow-sm hover:shadow-md"
                        >
                            <span className="flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                            </span>
                        </button>
                        <button
                            onClick={() => navigate(`/booth/${boothId}/results`)}
                            className="flex-1 max-w-[150px] bg-white hover:bg-green-50 text-green-700 py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold border border-green-200 hover:border-green-300 transition-all shadow-sm hover:shadow-md"
                        >
                            <span className="flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Results
                            </span>
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {(error || success) && (
                    <div className="mb-4">
                        {error && <Alert type="error" message={error} />}
                        {success && <Alert type="success" message={success} />}
                    </div>
                )}

                {/* Stats Cards - Horizontal scroll on mobile */}
                <div className="mb-6">
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                        <div className="flex-shrink-0 w-[120px] sm:w-auto sm:flex-1 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-4 text-center text-white snap-center">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{booth?.totalVotes || 0}</div>
                            <div className="text-xs sm:text-sm font-medium opacity-90 mt-1">Total Votes</div>
                        </div>
                        <div className="flex-shrink-0 w-[120px] sm:w-auto sm:flex-1 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-center text-white snap-center">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{booth?.members?.length || 0}</div>
                            <div className="text-xs sm:text-sm font-medium opacity-90 mt-1">Members</div>
                        </div>
                        <div className="flex-shrink-0 w-[120px] sm:w-auto sm:flex-1 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-center text-white snap-center">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{booth?.candidates?.length || 0}</div>
                            <div className="text-xs sm:text-sm font-medium opacity-90 mt-1">Candidates</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Invite Code & Link Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    Invite Code
                                </h3>
                                <button
                                    onClick={handleResetInviteCode}
                                    disabled={updating}
                                    className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-semibold disabled:opacity-50 px-2 sm:px-3 py-1 hover:bg-orange-50 rounded-lg transition-all"
                                >
                                    Reset
                                </button>
                            </div>
                            
                            {/* Code Display */}
                            <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 rounded-xl p-3 sm:p-4 mb-3 border-2 border-teal-200">
                                <div className="flex items-center justify-between">
                                    <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-teal-700 tracking-widest">
                                        {booth?.inviteCode}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(booth?.inviteCode, '✅ Code copied!')}
                                        className="p-2 hover:bg-white/80 rounded-xl transition-all group"
                                        title="Copy code"
                                    >
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Link Display */}
                            <div>
                                <div className="text-xs sm:text-sm text-gray-600 mb-2 flex items-center font-medium">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    Join Link
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap border border-gray-200">
                                        {`${window.location.origin}/api/booth/invite/${booth?.inviteCode}`}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(
                                            `${window.location.origin}/api/booth/invite/${booth?.inviteCode}`,
                                            '✅ Link copied!'
                                        )}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span className="hidden sm:inline">Copy</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Settings Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Settings
                                </h3>
                                <button
                                    onClick={() => {
                                        if (editingSettings) {
                                            setSettings(booth.settings || {});
                                        }
                                        setEditingSettings(!editingSettings);
                                    }}
                                    className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all ${
                                        editingSettings 
                                            ? 'text-gray-600 hover:bg-gray-100' 
                                            : 'text-blue-600 hover:bg-blue-50'
                                    }`}
                                >
                                    {editingSettings ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            {editingSettings ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-start sm:items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all">
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium pr-2">Results visible to voters</span>
                                            <input
                                                type="checkbox"
                                                checked={settings.resultsVisibleToVoters || false}
                                                onChange={(e) => handleSettingChange('resultsVisibleToVoters', e.target.checked)}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer flex-shrink-0"
                                            />
                                        </label>
                                        
                                        <label className="flex items-start sm:items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all">
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium pr-2">Anonymous voting</span>
                                            <input
                                                type="checkbox"
                                                checked={settings.anonymousVoting || false}
                                                onChange={(e) => handleSettingChange('anonymousVoting', e.target.checked)}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer flex-shrink-0"
                                            />
                                        </label>
                                        
                                        <label className="flex items-start sm:items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all">
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium pr-2">Allow vote changes</span>
                                            <input
                                                type="checkbox"
                                                checked={settings.allowVoteChange || false}
                                                onChange={(e) => handleSettingChange('allowVoteChange', e.target.checked)}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer flex-shrink-0"
                                            />
                                        </label>
                                        
                                        <label className="flex items-start sm:items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all">
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium pr-2">Show live results</span>
                                            <input
                                                type="checkbox"
                                                checked={settings.showLiveResults || false}
                                                onChange={(e) => handleSettingChange('showLiveResults', e.target.checked)}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer flex-shrink-0"
                                            />
                                        </label>
                                        
                                        <label className="flex items-start sm:items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all">
                                            <span className="text-xs sm:text-sm text-gray-700 font-medium pr-2">Require email verification</span>
                                            <input
                                                type="checkbox"
                                                checked={settings.requireEmailVerification || false}
                                                onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer flex-shrink-0"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <LoadingButton
                                            onClick={handleUpdateSettings}
                                            loading={updating}
                                            className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                                        >
                                            Save
                                        </LoadingButton>
                                        <button
                                            onClick={() => {
                                                setSettings(booth.settings || {});
                                                setEditingSettings(false);
                                            }}
                                            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center p-2.5 bg-gray-50 rounded-lg">
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.resultsVisibleToVoters ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-xs text-gray-700">Results visible</span>
                                    </div>
                                    <div className="flex items-center p-2.5 bg-gray-50 rounded-lg">
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.anonymousVoting ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-xs text-gray-700">Anonymous</span>
                                    </div>
                                    <div className="flex items-center p-2.5 bg-gray-50 rounded-lg">
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.allowVoteChange ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-xs text-gray-700">Vote changes</span>
                                    </div>
                                    <div className="flex items-center p-2.5 bg-gray-50 rounded-lg">
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.showLiveResults ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-xs text-gray-700">Live results</span>
                                    </div>
                                    <div className="flex items-center p-2.5 bg-gray-50 rounded-lg col-span-2">
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.requireEmailVerification ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-xs text-gray-700">Email verification</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delete Booth - Mobile visible */}
                        <div className="lg:hidden bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-4 shadow-lg">
                            <div className="flex items-center mb-3">
                                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-2.5">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold text-red-900">Danger Zone</h3>
                            </div>
                            <p className="text-xs text-red-700 mb-3">
                                Deleting this booth will permanently remove all data.
                            </p>
                            <button
                                onClick={handleDeleteBooth}
                                disabled={updating}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-xl"
                            >
                                Delete Booth
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Members */}
                    <div className="space-y-4">
                        {/* Members Container with fixed height */}
                        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col">
                            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Members
                                    <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold px-2 sm:px-2.5 py-0.5 rounded-full">
                                        {booth?.members?.length || 0}
                                    </span>
                                </h3>
                            </div>
                            
                            {/* Scrollable members list */}
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {booth?.members?.map((member, index) => (
                                    <div 
                                        key={member._id} 
                                        className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl transition-all border border-gray-200 hover:border-gray-300"
                                    >
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                            <div 
                                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md"
                                                style={{
                                                    background: `linear-gradient(135deg, ${
                                                        ['#0891b2', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][index % 6]
                                                    }, ${
                                                        ['#06b6d4', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa'][index % 6]
                                                    })`
                                                }}
                                            >
                                                {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-gray-900 text-sm truncate">
                                                    {member.user?.name || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                                                    <span>{new Date(member.joinedAt).toLocaleDateString()}</span>
                                                    {member.hasVoted && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {member.user?._id !== booth.creator?._id ? (
                                            <button
                                                onClick={() => handleRemoveMember(member.user._id)}
                                                disabled={removingMembers.has(member.user._id)}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 disabled:opacity-50 transition-all p-1.5 rounded-lg ml-2 flex-shrink-0"
                                                title="Remove member"
                                            >
                                                {removingMembers.has(member.user._id) ? (
                                                    <PageLoading size="sm" color="red" />
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-800 ml-2 flex-shrink-0">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                ))}
                                
                                {(!booth?.members || booth.members.length === 0) && (
                                    <div className="text-center py-12">
                                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="text-gray-500 text-sm font-medium">No members yet</p>
                                        <p className="text-gray-400 text-xs mt-1">Share the invite code</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Delete Booth - Desktop only */}
                        <div className="hidden lg:block bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-4 sm:p-6 shadow-lg">
                            <div className="flex items-center mb-3">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
                            </div>
                            <p className="text-sm text-red-700 mb-4">
                                ⚠️ Deleting this booth will permanently remove all votes, members, and data.
                            </p>
                            <button
                                onClick={handleDeleteBooth}
                                disabled={updating}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-md hover:shadow-xl"
                            >
                                Delete Booth Permanently
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #94a3b8;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                }
            `}</style>
        </div>
    );
};

export default BoothAdminPage;