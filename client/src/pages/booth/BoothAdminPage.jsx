import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { boothService } from '../../services/api';
import { Alert } from '../../components/layout/Alert';
import { LoadingButton, PageLoading } from '../../components/layout/Loading';
import BackButton from '../../components/layout/BackButton';
import { useToast } from '../../components/layout/Toast';
import ConfirmModal from '../../components/layout/ConfirmModal';

const BoothAdminPage = () => {
    const { boothId } = useParams();
    const navigate = useNavigate();
    
    const [booth, setBooth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();
    
    const [settings, setSettings] = useState({});
    const [editingSettings, setEditingSettings] = useState(false);
    const [removingMembers, setRemovingMembers] = useState(new Set());
    const [pendingActionLoading, setPendingActionLoading] = useState(new Set());
    const [confirm, setConfirm] = useState({ open: false, action: null, payload: null, loading: false });
    const [candidatesOpen, setCandidatesOpen] = useState(true);

    useEffect(() => {
        fetchBoothDetails();
    }, [boothId]);

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
            // Use admin API so we get pendingRequests populated for display
            const response = await boothService.getAdmin(boothId);

                if (response.success && response.data) {
                setBooth(response.data.booth);
                const srvSettings = response.data.booth.settings || {};
                // Ensure UI flag for domain restriction reflects existing domains
                setSettings({
                    ...srvSettings,
                    restrictByEmailDomain: Array.isArray(srvSettings.allowedEmailDomains) && srvSettings.allowedEmailDomains.length > 0
                });

                if (!response.data?.permissions?.isCreator) {
                    setError('You are not authorized to manage this booth');
                    return;
                }
            } else {
                setError(response.error || 'Failed to load booth details');
            }
        } catch (err) {
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
                // refresh data first, then notify user so toasts reflect final state
                await fetchBoothDetails();
                setEditingSettings(false);
                addToast('Settings updated successfully', 'success');
            } else {
                setError(response.error || 'Failed to update settings');
                addToast(response.error || 'Failed to update settings', 'error');
            }
        } catch (err) {
            setError(err.message || 'Failed to update settings');
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = booth.status === 'active' ? 'closed' : 'active';
        setConfirm({
            open: true,
            action: 'toggleStatus',
            payload: { newStatus },
            title: `${newStatus === 'active' ? 'Activate' : 'Close'} booth`,
            description: `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'close'} this booth?`
        });
        return;
    };

    const handleResetInviteCode = async () => {
        setConfirm({
            open: true,
            action: 'resetInvite',
            payload: null,
            title: 'Reset invite code',
            description: 'Generating a new invite code invalidates the previous code and links — anyone using the old link will no longer be able to join. Continue?'
        });
        return;
    };

    const handleRemoveMember = async (memberId) => {
        setConfirm({
            open: true,
            action: 'removeMember',
            payload: { memberId },
            title: 'Remove member',
            description: 'Are you sure you want to remove this member from the booth? This action will also remove their votes.'
        });
        return;
    };

    const handleApproveRequest = async (userId) => {
        setPendingActionLoading(prev => new Set(prev).add(userId));
        try {
            const response = await boothService.approveRequest(boothId, userId);
            if (response.success) {
                await fetchBoothDetails();
                addToast('Member approved', 'success');
            } else {
                addToast(response.error || 'Failed to approve request', 'error');
            }
        } catch (err) {
            addToast(err.message || 'Failed to approve request', 'error');
        } finally {
            setPendingActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const handleRejectRequest = async (userId) => {
        setPendingActionLoading(prev => new Set(prev).add(userId));
        try {
            const response = await boothService.rejectRequest(boothId, userId);
            if (response.success) {
                await fetchBoothDetails();
                addToast('Join request rejected', 'success');
            } else {
                addToast(response.error || 'Failed to reject request', 'error');
            }
        } catch (err) {
            addToast(err.message || 'Failed to reject request', 'error');
        } finally {
            setPendingActionLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    const handleDeleteBooth = async () => {
        setConfirm({
            open: true,
            action: 'deleteBooth',
            payload: null,
            title: 'Delete booth',
            description: '⚠️ This will permanently delete the booth and all related data. This action cannot be undone.',
            requireText: 'DELETE',
            confirmLabel: 'Delete permanently'
        });
        return;
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Central confirm handler invoked by ConfirmModal
    const onConfirm = async () => {
        const { action, payload } = confirm;
        try {
            if (action === 'toggleStatus') {
                setConfirm(prev => ({ ...prev, loading: true }));
                const response = await boothService.toggleStatus(boothId);
                if (response.success) {
                    await fetchBoothDetails();
                    addToast('Booth status updated', 'success');
                } else {
                    addToast(response.error || 'Failed to toggle status', 'error');
                }
            }

            if (action === 'resetInvite') {
                setConfirm(prev => ({ ...prev, loading: true }));
                const response = await boothService.resetInviteCode(boothId);
                if (response.success) {
                    await fetchBoothDetails();
                    addToast('Invite code reset successfully', 'success');
                } else {
                    addToast(response.error || 'Failed to reset invite code', 'error');
                }
            }

            if (action === 'removeMember') {
                const memberId = payload.memberId;
                setRemovingMembers(prev => new Set(prev).add(memberId));
                setConfirm(prev => ({ ...prev, loading: true }));
                const response = await boothService.removeMember(boothId, memberId);
                if (response.success) {
                    await fetchBoothDetails();
                    addToast('Member removed successfully', 'success');
                } else {
                    addToast(response.error || 'Failed to remove member', 'error');
                }
                setRemovingMembers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(memberId);
                    return newSet;
                });
            }

            if (action === 'removeCandidate') {
                // payload: { index }
                const index = payload?.index;
                if (typeof index !== 'number') {
                    addToast('Invalid candidate selected', 'error');
                } else {
                    setConfirm(prev => ({ ...prev, loading: true }));
                    try {
                        // Build updated candidate list
                        const updated = (booth?.candidates || []).filter((_, i) => i !== index);
                        const response = await boothService.updateBooth(boothId, { candidates: updated });
                        if (response && response.success) {
                    await fetchBoothDetails();
                    addToast('Candidate removed', 'success');
                        } else {
                    await fetchBoothDetails();
                    addToast(response?.error || 'Failed to remove candidate', 'error');
                        }
                    } catch (err) {
                await fetchBoothDetails();
                addToast(err.message || 'Failed to remove candidate', 'error');
                    }
                }
            }

            if (action === 'deleteBooth') {
                setConfirm(prev => ({ ...prev, loading: true }));
                const response = await boothService.deleteBooth(boothId);
                if (response.success) {
                    addToast('Booth deleted successfully', 'success');
                    navigate('/dashboard');
                } else {
                    addToast(response.error || 'Failed to delete booth', 'error');
                }
            }
        } catch (err) {
            addToast(err.message || 'Action failed', 'error');
        } finally {
            setConfirm({ open: false, action: null, payload: null, loading: false });
        }
    };

    const onCancel = () => {
        setConfirm({ open: false, action: null, payload: null, loading: false });
    };

    const copyToClipboard = async (text, message) => {
        try {
            await navigator.clipboard.writeText(text);
            addToast(message || 'Copied to clipboard', 'success');
        } catch (err) {
            addToast('Failed to copy to clipboard', 'error');
        }
    };

    // Inline share/copy feedback (used in invite card) — avoids using global toasts in that card
    const [shareStatus, setShareStatus] = useState('');
    const clearShareStatus = () => setTimeout(() => setShareStatus(''), 3500);

    const copyAndShowInline = async (text, message) => {
        try {
            await navigator.clipboard.writeText(text);
            setShareStatus(message || 'Copied to clipboard');
            clearShareStatus();
        } catch (err) {
            setShareStatus('Failed to copy to clipboard');
            clearShareStatus();
        }
    };

    const handleShareInvite = async () => {
        if (!booth || !booth.inviteCode) return;
        const joinLink = `${window.location.origin}/booth/join/${booth.inviteCode}`;
        const message = `You're invited to join \"${booth.name}\"!\n\n${booth.description || ''}\n\nJoin with code: ${booth.inviteCode}\nOr open: ${joinLink}\n\nSee you there!`;

        // Use native share when available (mobile), otherwise copy fallback
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join: ${booth.name}`,
                    text: message,
                    url: joinLink
                });
                return;
            } catch (err) {
                // If user cancelled share, silently ignore. Otherwise fallback to copy.
                if (err.name !== 'AbortError') {
                    await copyToClipboard(message, 'Invite message copied to clipboard');
                }
                return;
            }
        }

        // Fallback: copy message to clipboard and notify
        await copyToClipboard(message, 'Invite message copied to clipboard');
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
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 pb-4 overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-4 pt-6 sm:pt-8">
                {/* Title Section (compact header: back left, title center, actions right) - no card */}
                <div className="mb-6">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-20 sm:w-24 flex-shrink-0 flex items-start">
                                <BackButton
                                    to={`/booth/${boothId}`}
                                    label="Back"
                                    className="text-sm px-2 py-1 md:px-3 md:py-1.5 bg-white"
                                />
                            </div>

                            <div className="flex-1 text-center px-4">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{booth?.name}</h1>
                            <p className="text-gray-600 text-sm sm:text-base font-medium">Admin Dashboard</p>
                        </div>

                        <div className="w-20 sm:w-24 flex-shrink-0 flex items-center justify-end">
                            <div className="text-right">
                                <div className="text-sm font-bold text-black-500 mb-2">Status</div>

                                <button
                                    onClick={handleToggleStatus}
                                    disabled={updating}
                                    aria-label="Toggle booth status"
                                    className={`relative inline-flex mt-0 h-5 w-10 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        booth?.status === 'active'
                                            ? 'bg-green-600 focus:ring-green-500'
                                            : 'bg-gray-300 focus:ring-gray-300'
                                    }`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                                        booth?.status === 'active' ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                                </button>

                                <div className={`mt-1 text-xs font-bold ${booth?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                    {booth?.status === 'active' ? 'Active' : 'Closed'}
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-2">
                                    {(settings.allowedEmailDomains && settings.allowedEmailDomains.length > 0) || settings.restrictByEmailDomain ? (
                                        <div className="p-2.5 bg-gray-50 rounded-lg">
                                            <div className="text-xs text-gray-700 font-medium">Allowed domains</div>
                                            <div className="text-xs text-gray-500">{(settings.allowedEmailDomains || []).join(', ')}</div>
                                        </div>
                                    ) : null}

                                    {(settings.votingStartTime || settings.votingEndTime) && (
                                        <div className="p-2.5 bg-gray-50 rounded-lg">
                                            <div className="text-xs text-gray-700 font-medium">Voting schedule</div>
                                            <div className="text-xs text-gray-500">
                                                {settings.votingStartTime ? `Starts: ${new Date(settings.votingStartTime).toLocaleString()}` : ''}
                                                {settings.votingStartTime && settings.votingEndTime ? ' • ' : ''}
                                                {settings.votingEndTime ? `Ends: ${new Date(settings.votingEndTime).toLocaleString()}` : ''}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Quick Actions (neutral style) */}
                    <div className="flex flex-row gap-3 justify-center mt-4">
                        <button
                            onClick={() => navigate(`/booth/${boothId}`)}
                            className="flex-1 max-w-[150px] bg-white text-teal-700 border border-teal-200 hover:bg-gray-50 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 shadow-sm"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="text-xs sm:text-sm">View Booth</span>
                            </span>
                        </button>
                        <button
                            onClick={() => navigate(`/booth/${boothId}/results`)}
                            className="flex-1 max-w-[150px] bg-white text-green-700 border border-green-200 hover:bg-gray-50 py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 shadow-sm"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="text-xs sm:text-sm">Results</span>
                            </span>
                        </button>
                    </div>

                    {/* Status Toggle moved to header */}
                </div>

                {/* Alerts (errors only; success uses toasts) */}
                {error && (
                    <div className="mb-4">
                        <Alert type="error" message={error} />
                    </div>
                )}

                {/* Stats Cards - Modern Design (Unified Style) */}
<div className="mb-6">
  <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
    
    {/* Total Votes */}
    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl p-4 sm:p-6 text-center border border-gray-100 transition-all duration-300 hover:scale-105 hover:border-teal-200 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 group">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-teal-600 mb-1">
        {booth?.totalVotes || 0}
      </div>
      <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Votes</div>
    </div>

    {/* Members */}
    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl p-4 sm:p-6 text-center border border-gray-100 transition-all duration-300 hover:scale-105 hover:border-purple-200 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 group">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1">
        {booth?.members?.length || 0}
      </div>
      <div className="text-xs sm:text-sm text-gray-600 font-medium">Members</div>
    </div>

    {/* Candidates */}
    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl p-4 sm:p-6 text-center border border-gray-100 transition-all duration-300 hover:scale-105 hover:border-blue-200 hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 group">
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1">
        {booth?.candidates?.length || 0}
      </div>
      <div className="text-xs sm:text-sm text-gray-600 font-medium">Candidates</div>
    </div>

  </div>
</div>


                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Invite Code & Link Card */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Invite Code</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleResetInviteCode}
                                        disabled={updating}
                                        className="bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-700 hover:text-red-700 font-semibold disabled:opacity-50 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs sm:text-sm border border-orange-200 hover:border-red-200"
                                    >
                                        Reset
                                    </button>

                                    {/* Info tooltip for reset button */}
                                    <div className="relative group inline-block">
                                        <button
                                            type="button"
                                            aria-label="What does reset do"
                                            className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-xs font-medium transition-all duration-300 shadow-md"
                                        >
                                            i
                                        </button>
                                        <div className="pointer-events-none absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-gray-800 text-white text-xs leading-tight rounded-lg shadow-xl px-3 py-2 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all z-50">
                                            Generating a new invite code invalidates the previous code and links — anyone using the old link will no longer be able to join. Use this when you want to block existing invite links.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Code Display */}
                            <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 rounded-xl p-3 sm:p-4 mb-3 border-2 border-teal-200">
                                <div className="flex items-center justify-between">
                                    <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-teal-700 tracking-widest">
                                        {booth?.inviteCode}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(booth?.inviteCode, 'Code copied to clipboard')}
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
                                        {`${window.location.origin}/booth/join/${booth?.inviteCode}`}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(
                                            `${window.location.origin}/booth/join/${booth?.inviteCode}`,
                                            'Link copied to clipboard'
                                        )}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                                    >
                                        <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span className="hidden sm:inline">Copy</span>
                                    </button>
                                    <button
                                        onClick={handleShareInvite}
                                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v.01M12 12v.01M20 12v.01M4 12a8 8 0 0116 0M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8" />
                                        </svg>
                                        <span className="hidden sm:inline">Share</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Settings Card */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Settings</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        if (editingSettings) {
                                            setSettings(booth.settings || {});
                                        }
                                        setEditingSettings(!editingSettings);
                                    }}
                                    className={`font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 text-xs sm:text-sm ${
                                        editingSettings 
                                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300' 
                                            : 'bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-700 border border-blue-200'
                                    }`}
                                >
                                    {editingSettings ? 'Cancel' : 'Edit'}
                                </button>
                            </div>

                            {editingSettings ? (
                                <div className="space-y-6">
                                    {/* Voting Rules */}
                                    <div className="space-y-2">
                                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Voting Rules</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                                <span className="text-xs sm:text-sm text-gray-700 font-medium pr-2">Show live results</span>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.showLiveResults || false}
                                                    onChange={(e) => handleSettingChange('showLiveResults', e.target.checked)}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer flex-shrink-0"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {/* Access Control */}
                                    <div className="space-y-2">
                                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Access Control</h3>
                                        <div className="space-y-3">
                                            <label className="flex items-start sm:items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all">
                                                <span className="text-xs sm:text-sm text-gray-700 font-medium pr-2">Require approval</span>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.requireApproval || false}
                                                    onChange={(e) => handleSettingChange('requireApproval', e.target.checked)}
                                                    className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer flex-shrink-0"
                                                />
                                            </label>

                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 pr-3">
                                                        <label className="text-sm font-medium text-gray-900">Restrict by email domain</label>
                                                        <p className="text-sm text-gray-600">Only allow members with emails from listed domains to join.</p>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        <input
                                                            id="restrictByEmailDomain"
                                                            type="checkbox"
                                                            checked={settings.restrictByEmailDomain || false}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                handleSettingChange('restrictByEmailDomain', checked);
                                                                if (!checked) {
                                                                    handleSettingChange('allowedEmailDomains', []);
                                                                }
                                                            }}
                                                            className="mt-1 h-4 w-4 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500"
                                                        />
                                                    </div>

                                                </div>

                                                {settings.restrictByEmailDomain && (
                                                    <div className="mt-3">
                                                        <input
                                                            type="text"
                                                            value={(settings.allowedEmailDomains || []).join(', ')}
                                                            onChange={(e) => handleSettingChange('allowedEmailDomains', String(e.target.value || '').split(',').map(s => s.trim()).filter(Boolean))}
                                                            placeholder="example.com, organization.org"
                                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                        />
                                                        <p className="text-xs text-gray-500">Comma separated domains to restrict who can join. Leave blank to allow any domain.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Settings */}
                                    <div className="space-y-2">
                                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Voting Schedule (Optional)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Voting Start Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={settings.votingStartTime || ''}
                                                    onChange={(e) => handleSettingChange('votingStartTime', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Voting End Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={settings.votingEndTime || ''}
                                                    onChange={(e) => handleSettingChange('votingEndTime', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <LoadingButton
                                            onClick={handleUpdateSettings}
                                            loading={updating}
                                            className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 text-white py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                                        >
                                            Save Changes
                                        </LoadingButton>
                                        <button
                                            onClick={() => {
                                                setSettings(booth.settings || {});
                                                setEditingSettings(false);
                                            }}
                                            className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition-all duration-300 border border-gray-300"
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
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.showLiveResults ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-xs text-gray-700">Live results</span>
                                    </div>

                                    <div className="flex items-center p-2.5 bg-gray-50 rounded-lg">
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.requireApproval ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-xs text-gray-700">Require approval</span>
                                    </div>

                                    <div className="flex items-center p-2.5 bg-gray-50 rounded-lg">
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${(settings.restrictByEmailDomain || (settings.allowedEmailDomains && settings.allowedEmailDomains.length > 0)) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-xs text-gray-700">Domain restriction</span>
                                    </div>

                                    <div className="flex items-center p-2.5 bg-gray-50 rounded-lg col-span-2">
                                        <span className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${(settings.votingStartTime || settings.votingEndTime) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                        <span className="text-xs text-gray-700">Scheduled</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Candidates Management Card */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-3">
                                    <button
                                        onClick={() => setCandidatesOpen(prev => !prev)}
                                        aria-expanded={candidatesOpen}
                                        className="flex items-center gap-3 focus:outline-none"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Candidates</h3>
                                        <span className="ml-2 text-xs text-gray-500 hidden sm:inline">{booth?.candidates?.length || 0} items</span>
                                    </button>
                                    <button
                                        onClick={() => setCandidatesOpen(prev => !prev)}
                                        aria-label={candidatesOpen ? 'Collapse candidates' : 'Expand candidates'}
                                        className="p-1 rounded-md hover:bg-gray-100"
                                    >
                                        <svg className={`w-4 h-4 transform transition-transform ${candidatesOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {candidatesOpen && (
                                    <>
                                        {/* If votes exist, candidate edits are locked */}
                                        {booth?.totalVotes > 0 ? (
                                            <div className="mb-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100 text-sm text-yellow-800">
                                                Candidate editing is locked — this booth already has <strong>{booth.totalVotes}</strong> vote{booth.totalVotes > 1 ? 's' : ''} recorded. To prevent audit issues, you cannot add or remove candidates once votes exist. If you need to change candidates, consider exporting the booth data and recreating the booth.
                                            </div>
                                        ) : (
                                            <div className="mb-3 p-3 rounded-lg bg-teal-50 border border-teal-100 text-sm text-teal-800">
                                                No votes recorded yet — you can add, remove, and reorder candidates freely. Changes must be saved to take effect.
                                            </div>
                                        )}

                                        {/* Candidate list (compact) */}
                                        <div className="space-y-2">
                                            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                                {booth?.candidates?.map((candidate, idx) => (
                                                    <div key={candidate._id || candidate.name + idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-all text-sm">
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">{candidate.name}</div>
                                                            {candidate.description && <div className="text-xs text-gray-500 truncate">{candidate.description}</div>}
                                                        </div>

                                                        <div className="ml-3 flex items-center gap-2">
                                                            <div className="text-xs text-gray-500">{candidate.voteCount || 0} votes</div>
                                                            {/* Remove button only when no votes */}
                                                            <button
                                                                onClick={() => {
                                                                    if (booth?.totalVotes > 0) return;
                                                                    setConfirm({
                                                                        open: true,
                                                                        action: 'removeCandidate',
                                                                        payload: { index: idx },
                                                                        title: 'Remove candidate',
                                                                        description: `Remove candidate "${candidate.name}"? This cannot be undone.`
                                                                    });
                                                                }}
                                                                disabled={booth?.totalVotes > 0}
                                                                className={`p-1 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-red-100`}
                                                                title={booth?.totalVotes > 0 ? 'Locked while votes exist' : 'Remove candidate'}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add candidate area (only when no votes) */}
                                            {booth?.totalVotes === 0 && (
                                                <div className="pt-2 border-t border-gray-100">
                                                    <AddCandidateInline
                                                        onAdd={async (newCandidate) => {
                                                            // optimistic UI update: append candidate locally and attempt to persist
                                                            const updated = [...(booth?.candidates || []), { ...newCandidate, voteCount: 0 }];
                                                            setBooth(prev => ({ ...prev, candidates: updated }));
                                                            try {
                                                                const response = await boothService.updateBooth(boothId, { candidates: updated });
                                                                if (response && response.success) {
                                                                    addToast('Candidates updated', 'success');
                                                                    await fetchBoothDetails();
                                                                } else {
                                                                    addToast(response?.error || 'Failed to save candidates', 'error');
                                                                    await fetchBoothDetails();
                                                                }
                                                            } catch (err) {
                                                                addToast(err.message || 'Failed to save candidates', 'error');
                                                                await fetchBoothDetails();
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                        </div>

                        {/* Deleted duplicate mobile block — single Danger Zone appears at the end of the page now */}
                    </div>

                        {/* Right Column - Members */}
                    <div className="space-y-4">
                        {/* Members Container with compact mobile height */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 border border-gray-100 h-[240px] sm:h-[500px] lg:h-[600px] flex flex-col hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Members</h3>
                                </div>
                                <span className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm">
                                    {booth?.members?.length || 0} {booth?.members?.length === 1 ? 'member' : 'members'}
                                </span>
                            </div>
                            
                            {/* Scrollable members list */}
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                                {/* Pending join requests (when requireApproval is enabled) */}
                                {booth?.pendingRequests && booth.pendingRequests.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">Pending requests</div>
                                                <div className="text-xs text-gray-500">Approve or reject users waiting to join</div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {booth.pendingRequests.map((req) => (
                                                <div key={(req.user && (req.user._id || req.user)) || JSON.stringify(req)} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-gray-900 text-sm truncate">{req.user?.name || (req.user?._id || req.user)}</div>
                                                        <div className="text-xs text-gray-500">{req.user?.email || ''}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleApproveRequest(req.user._id || req.user)}
                                                            disabled={pendingActionLoading.has(req.user._id || req.user)}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                                                        >
                                                            {pendingActionLoading.has(req.user._id || req.user) ? '...' : 'Approve'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRequest(req.user._id || req.user)}
                                                            disabled={pendingActionLoading.has(req.user._id || req.user)}
                                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold disabled:opacity-50 border border-gray-200"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {booth?.members?.map((member, index) => (
                                    <div 
                                        key={member._id} 
                                        className="group flex items-center justify-between p-2 sm:p-4 bg-gradient-to-r from-gray-50 via-white to-gray-50 hover:from-indigo-50 hover:via-purple-50 hover:to-pink-50 rounded-lg sm:rounded-xl transition-all duration-300 border border-gray-200 hover:border-indigo-200 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div 
                                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300"
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
                                                <div className="font-bold text-gray-900 text-sm sm:text-base truncate group-hover:text-indigo-900 transition-colors">
                                                    {member.user?.name || 'Unknown User'}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6-6m-6 0l6 6" />
                                                        </svg>
                                                        <span className="font-medium">{new Date(member.joinedAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {member.hasVoted && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Voted
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {member.user?._id !== booth.creator?._id ? (
                                            <button
                                                onClick={() => handleRemoveMember(member.user._id)}
                                                disabled={removingMembers.has(member.user._id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 disabled:opacity-50 transition-all duration-300 p-2 rounded-lg ml-2 flex-shrink-0 border border-transparent hover:border-red-200 group-hover:scale-105"
                                                title="Remove member"
                                            >
                                                {removingMembers.has(member.user._id) ? (
                                                    <PageLoading size="sm" color="red" />
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 ml-2 flex-shrink-0 border border-amber-200 shadow-sm">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                                                </svg>
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                ))}
                                
                                {(!booth?.members || booth.members.length === 0) && (
                                    <div className="text-center py-12 sm:py-16">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-600 text-base sm:text-lg font-bold mb-2">No members yet</p>
                                        <p className="text-gray-400 text-sm mb-4">Share the invite code to get people to join</p>
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                                            <p className="text-indigo-700 text-xs font-medium">💡 Tip: Use the invite code or link above to invite members</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Danger Zone (Delete Booth) — single block, last in DOM and visible on all sizes */}
                        <div className="bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200 rounded-lg sm:rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
                            </div>
                            <p className="text-sm text-red-700 mb-6 leading-relaxed">
                                ⚠️ Deleting this booth will permanently remove all votes, members, and data. This action cannot be undone and all participants will lose access.
                            </p>
                            <button
                                onClick={handleDeleteBooth}
                                disabled={updating}
                                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                            >
                                Delete Booth Permanently
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <ConfirmModal
                isOpen={confirm.open}
                title={confirm.title}
                description={confirm.description}
                confirmLabel={confirm.confirmLabel || 'Confirm'}
                requireText={confirm.requireText}
                loading={confirm.loading}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />

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

// Small inline add-candidate component
const AddCandidateInline = ({ onAdd }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [adding, setAdding] = useState(false);

    const submit = async () => {
        if (!name.trim()) return;
        setAdding(true);
        try {
            await onAdd({ name: name.trim(), description: description.trim() });
            setName('');
            setDescription('');
            setOpen(false);
        } catch (err) {
            // onAdd should surface errors via toasts
        } finally {
            setAdding(false);
        }
    };

    if (!open) {
        return (
            <div className="flex">
                <button
                    onClick={() => setOpen(true)}
                    aria-expanded={open}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
                >
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add candidate</span>
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Candidate name"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description (optional)"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <div className="flex items-center gap-2">
                <button
                    onClick={submit}
                    disabled={adding || !name.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {adding ? 'Adding...' : 'Add'}
                </button>
                <button
                    onClick={() => { setOpen(false); setName(''); setDescription(''); }}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default BoothAdminPage;