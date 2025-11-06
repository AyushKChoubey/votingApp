import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { boothService } from '../../services/api';
import { Alert } from '../../components/layout/Alert';
import { LoadingButton, PageLoading } from '../../components/layout/Loading';
import { useToast } from '../../components/layout/Toast';
import BackButton from '../../components/layout/BackButton';

const BoothDetailPage = () => {
    const { boothId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const [booth, setBooth] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [votingStatus, setVotingStatus] = useState({});
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [error, setError] = useState('');
    const socketRef = useRef(null);
    const { addToast } = useToast();

    useEffect(() => {
        // Load booth details first, then show any toasts that depend on membership
        (async () => {
            const ok = await fetchBoothDetails();
            const joined = searchParams.get('joined');
            if (joined === 'true' && ok) {
                addToast('Welcome to the booth! You have successfully joined.', 'success');
            }
        })();
    }, [boothId, searchParams]);

    // Live results socket connection
    useEffect(() => {
        // Only connect when live results are enabled for this booth
        if (!booth?.settings?.showLiveResults) return;

        let mounted = true;
        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        (async () => {
            try {
                const mod = await import('socket.io-client');
                const ioClient = mod.io || mod.default || mod;

                if (!mounted) return;

                const socket = ioClient(SOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    auth: { token: localStorage.getItem('token') }
                });

                socketRef.current = socket;

                socket.on('connect', () => {
                    // join booth room
                    socket.emit('joinBooth', boothId);
                });

                socket.on('vote:update', (payload) => {
                    // Update only aggregates to avoid overwriting client-only state
                    if (!payload) return;
                    setBooth((prev) => {
                        if (!prev) return prev;
                        return { ...prev, candidates: payload.candidates, totalVotes: payload.totalVotes };
                    });
                    // Optionally refresh stats
                    setStats((prev) => ({ ...prev }));
                });

                socket.on('disconnect', () => {
                    // handle disconnect silently
                });
            } catch (err) {
                console.error('Failed to initialize live socket (dynamic import)', err);
            }
        })();

        return () => {
            mounted = false;
            try {
                const s = socketRef.current;
                if (s) {
                    s.emit('leaveBooth', boothId);
                    s.disconnect();
                }
                socketRef.current = null;
            } catch (e) {
                // no-op
            }
        };
    }, [booth?.settings?.showLiveResults, boothId]);

    const fetchBoothDetails = async () => {
        try {
            setLoading(true);
            const response = await boothService.getBooth(boothId);
            
            if (response.success && response.data) {
                setBooth(response.data.booth);
                setPermissions(response.data.permissions);
                setVotingStatus(response.data.votingStatus);
                setStats(response.data.stats);
                return true;
            } else {
                setError('Failed to load booth details');
                return false;
            }
        } catch (err) {
            if (err.status === 403) {
                setError('You are not a member of this booth. Please join using an invite code.');
            } else if (err.status === 404) {
                setError('Booth not found');
            } else {
                setError('Failed to load booth details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (candidateIndex) => {
        if (!permissions.canVote) return;
        
        try {
            setVoting(true);
            const response = await boothService.vote(boothId, candidateIndex);
            
            if (response.success) {
                // Refresh data first so the UI reflects the new vote, then show toast
                await fetchBoothDetails(); // Refresh data
                addToast('Your vote has been recorded successfully!', 'success');
                setSelectedCandidate(null);
            } else {
                setError(response.error || 'Failed to record vote');
            }
        } catch (err) {
            // Vote error
            setError(err.message || 'Failed to record vote');
        } finally {
            setVoting(false);
        }
    };

    const handleCopyInviteCode = () => {
        if (booth?.inviteCode) {
            navigator.clipboard.writeText(booth.inviteCode);
            addToast('Invite code copied to clipboard!', 'success');
        }
    };



    const handleCopyDirectInviteLink = () => {
        if (booth?.inviteCode) {
            const link = `${window.location.origin}/booth/join/${booth.inviteCode}`;
            navigator.clipboard.writeText(link);
            addToast('Invite link copied to clipboard!', 'success');
        }
    };

    const handleCopyDetailsPlain = () => {
        if (!booth) return;
        const max = Number(booth?.maxMembers);
        const maxDisplay = (!Number.isNaN(max) && max > 0) ? max : 'Unlimited';
        const membersCount = booth?.memberCount ?? (booth?.members ? booth.members.length : 0);
        const link = `${window.location.origin}/booth/join/${booth.inviteCode}`;

        const details = `Booth: ${booth.name}\nDescription: ${booth.description || 'No description'}\nInvite Code: ${booth.inviteCode}\nJoin Link: ${link}\nMembers: ${membersCount} / ${maxDisplay}`;

        try {
            navigator.clipboard.writeText(details);
            addToast('Booth details copied as plain text', 'success');
        } catch (err) {
            // Copy details failed
            addToast('Failed to copy details', 'error');
        }
    };

    const handleShareBooth = async () => {
        if (!booth?.inviteCode) return;
        
        const shareData = {
            title: `Vote in: ${booth.name}`,
            text: `Join the voting booth "${booth.name}" - click to join instantly!`,
            url: `${window.location.origin}/booth/join/${booth.inviteCode}`
        };

        // Check if native share is available (mobile devices)
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                addToast('Shared successfully!', 'success');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // Fallback to copy link
                    handleCopyDirectInviteLink();
                }
            }
        } else {
            // Fallback to copy link
            handleCopyDirectInviteLink();
        }
    };

    const getVotingStatusMessage = () => {
        if (!votingStatus.allowed) {
            if (votingStatus.reason === 'not_started') {
                return 'Voting has not started yet';
            } else if (votingStatus.reason === 'ended') {
                return 'Voting has ended';
            } else if (votingStatus.reason === 'closed') {
                return 'Booth is closed';
            }
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center">
                <div className="text-center">
                    <PageLoading size="lg" color="teal" />
                    <p className="text-gray-700 mt-4 text-lg">Loading booth details...</p>
                </div>
            </div>
        );
    }

    if (error && !booth) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/booth/join')}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                            >
                                Join a Booth
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Derived values for display
    const membersCount = booth ? (Array.isArray(booth.members) ? booth.members.length : (booth.memberCount || 0)) : 0;
    const maxMembersDisplay = (() => {
        const max = Number(booth?.maxMembers);
        return (!Number.isNaN(max) && max > 0) ? max : 'Unlimited';
    })();

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header (no card) - compact header: back left, title center, actions right */}
                <div className="mb-6">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-20 sm:w-24 flex-shrink-0 flex items-start">
                            <BackButton
                                to="/dashboard"
                                label="Back"
                                className="text-sm px-2 py-1 md:px-3 md:py-1.5 bg-white"
                            />
                        </div>

                        <div className="flex-1 text-center px-4">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">{booth?.name}</h1>
                            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">{booth?.description}</p>
                        </div>

                        <div className="w-20 sm:w-24 flex-shrink-0" />
                    </div>

                    {/* Status Badges - Mobile Responsive */}
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-2">
                        <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${
                            booth?.status === 'active' 
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200'
                        }`}>
                            {booth?.status?.toUpperCase()}
                        </span>

                        {permissions.isCreator && (
                            <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200">
                                CREATOR
                            </span>
                        )}

                        {permissions.hasVoted && (
                            <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200">
                                VOTED
                            </span>
                        )}
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 sm:mb-6">
                        <Alert type="error" message={error} />
                    </div>
                )}

                {/* Quick Stats - Modern Design */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl p-4 sm:p-6 text-center border border-gray-100 transition-all duration-300 hover:scale-105 hover:border-teal-200 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 group">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-teal-600 mb-1">{booth?.totalVotes || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Votes</div>
                    </div>
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl p-4 sm:p-6 text-center border border-gray-100 transition-all duration-300 hover:scale-105 hover:border-blue-200 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 group">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1">{membersCount}</div>
                        <div className="text-xs sm:text-sm text-gray-600 font-medium">Members</div>
                    </div>
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl p-4 sm:p-6 text-center border border-gray-100 transition-all duration-300 hover:scale-105 hover:border-purple-200 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 group">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1">{booth?.candidates?.length || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-600 font-medium">Candidates</div>
                    </div>
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl p-4 sm:p-6 text-center border border-gray-100 transition-all duration-300 hover:scale-105 hover:border-green-200 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 group">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">
                            {stats?.votingPercentage ? `${Math.round(stats.votingPercentage)}%` : '0%'}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 font-medium">Participation</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Voting Status */}
                        {getVotingStatusMessage() && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <span className="text-amber-800 font-medium text-sm sm:text-base">{getVotingStatusMessage()}</span>
                                </div>
                            </div>
                        )}

                        {/* Voting Interface */}
                        {permissions.canVote && (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                                <div className="flex items-center mb-4 sm:mb-6">
                                    <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Cast Your Vote</h2>
                                </div>
                                <div className="space-y-3 sm:space-y-4">
                                    {booth?.candidates?.map((candidate, index) => (
                                        <div
                                            key={candidate._id}
                                            className={`border-2 rounded-lg sm:rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                                                selectedCandidate === index
                                                    ? 'border-teal-500 bg-gradient-to-r from-teal-50 to-cyan-50 shadow-lg ring-2 ring-teal-200'
                                                    : 'border-gray-200 hover:border-teal-300 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:shadow-md'
                                            }`}
                                            onClick={() => setSelectedCandidate(index)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                                                            selectedCandidate === index ? 'bg-teal-100' : 'bg-gray-100'
                                                        }`}>
                                                            <span className={`text-sm font-bold ${
                                                                selectedCandidate === index ? 'text-teal-600' : 'text-gray-600'
                                                            }`}>
                                                                {index + 1}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{candidate.name}</h3>
                                                    </div>
                                                    {candidate.description && (
                                                        <p className="text-sm sm:text-base text-gray-600 ml-9 leading-relaxed">{candidate.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center ml-4">
                                                    <input
                                                        type="radio"
                                                        name="candidate"
                                                        value={index}
                                                        checked={selectedCandidate === index}
                                                        onChange={() => setSelectedCandidate(index)}
                                                        className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 focus:ring-teal-500 focus:ring-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <LoadingButton
                                    onClick={() => handleVote(selectedCandidate)}
                                    disabled={selectedCandidate === null || voting}
                                    loading={voting}
                                    className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 text-white py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                        Submit Vote
                                </LoadingButton>
                            </div>
                        )}

                        {/* Results Preview */}
                        {(permissions.hasVoted || !permissions.canVote) && booth?.settings?.resultsVisibleToVoters && (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
                                <div className="flex items-center mb-4 sm:mb-6">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Current Results</h2>
                                </div>
                                <div className="space-y-4 sm:space-y-6">
                                    {booth?.candidates?.map((candidate, index) => {
                                        const percentage = booth.totalVotes > 0 
                                            ? Math.round((candidate.voteCount / booth.totalVotes) * 100) 
                                            : 0;
                                        
                                        return (
                                            <div key={candidate._id} className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-all duration-300">
                                                <div className="flex justify-between items-start mb-2 sm:mb-3">
                                                    <div className="flex items-center flex-1">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center mr-3 flex-shrink-0">
                                                            <span className="text-xs font-bold text-teal-600">{index + 1}</span>
                                                        </div>
                                                        <span className="font-semibold text-gray-900 text-sm sm:text-base">{candidate.name}</span>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <div className="text-lg sm:text-xl font-bold text-teal-600">{percentage}%</div>
                                                        <div className="text-xs sm:text-sm text-gray-500">{candidate.voteCount} votes</div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                                                    <div 
                                                        className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {permissions.isCreator && (
                                    <button
                                        onClick={() => navigate(`/booth/${boothId}/results`)}
                                        className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 sm:py-3 px-6 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        View Detailed Results
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Already Voted Message */}
                        {permissions.hasVoted && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-green-800 text-sm sm:text-base">Vote Recorded!</div>
                                        <div className="text-green-700 text-xs sm:text-sm">Thank you! Your vote has been recorded successfully.</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Booth Info */}
                        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center mb-4 sm:mb-6">
                                <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Booth Information</h3>
                            </div>
                            
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="text-gray-600 text-sm sm:text-base">Created by:</span>
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{booth?.creator?.name}</span>
                                </div>
                                
                                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="text-gray-600 text-sm sm:text-base">Created:</span>
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">
                                        {booth?.createdAt ? new Date(booth.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="text-gray-600 text-sm sm:text-base">Members:</span>
                                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{membersCount} / {maxMembersDisplay}</span>
                                </div>
                                
                                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="text-gray-600 text-sm sm:text-base">Status:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${booth?.status === 'active' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                                            booth?.status === 'draft' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' :
                                                'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                                        }`}>
                                        {booth?.status?.charAt(0).toUpperCase() + booth?.status?.slice(1)}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <span className="text-gray-600 text-sm sm:text-base">Type:</span>
                                    <span className="font-semibold text-purple-600 text-sm sm:text-base">Private</span>
                                </div>
                            </div>
                        </div>

                        {/* Invite Section */}
                        {permissions.isCreator && booth?.inviteCode && (
                            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
                                <div className="flex items-center mb-4 sm:mb-6">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Share This Booth</h3>
                                </div>
                                
                                <div className="space-y-3 sm:space-y-4">
                                    {/* Invite Code & Link (visible) */}
                                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Invite Code</label>
                                        <div className="flex items-center gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={booth.inviteCode}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                            <button
                                                onClick={handleCopyInviteCode}
                                                title="Copy invite code"
                                                className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition"
                                            >
                                                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>

                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Invite Link</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={`${window.location.origin}/booth/join/${booth.inviteCode}`}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                            <button
                                                onClick={handleCopyDirectInviteLink}
                                                title="Copy invite link"
                                                className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition"
                                            >
                                                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Invite code and full link are visible for quick copying. Sharing via native share is hidden per settings.</p>
                                    </div>

                                    {/* Compact action row for small screens */}
                                    <div className="grid grid-cols-2 gap-2">
                                        

                                        <button
                                            onClick={handleCopyDetailsPlain}
                                            className="w-full bg-white border border-gray-200 text-gray-800 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                                        >
                                            Copy Details
                                        </button>
                                    </div>

                                    {/* Info Banner */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4 shadow-sm">
                                        <div className="flex items-start">
                                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-blue-800">✨ One-Click Join</p>
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Recipients can join instantly by clicking the link. They'll be prompted to login if needed.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Admin Actions (compact) */}
                        {permissions.isCreator && (
                            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-100 p-3 sm:p-4 transition-all duration-150">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-md sm:text-lg font-semibold text-gray-900">Admin</h3>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => navigate(`/booth/${boothId}/admin`)}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:opacity-95 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                            </svg>
                                            <span className="hidden sm:inline">Manage</span>
                                        </button>

                                        <button
                                            onClick={() => navigate(`/booth/${boothId}/results`)}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-95 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            <span className="hidden sm:inline">Results</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                       
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoothDetailPage;
