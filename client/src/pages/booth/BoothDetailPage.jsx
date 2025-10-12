import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { boothService } from '../../services/api';
import { Alert } from '../../components/layout/Alert';
import { LoadingButton, PageLoading } from '../../components/layout/Loading';
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
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchBoothDetails();
        
        // Check for join success message
        const joined = searchParams.get('joined');
        if (joined === 'true') {
            setSuccess('Welcome to the booth! You have successfully joined.');
        }
    }, [boothId, searchParams]);

    const fetchBoothDetails = async () => {
        try {
            setLoading(true);
            const response = await boothService.getBooth(boothId);
            
            if (response.success && response.data) {
                setBooth(response.data.booth);
                setPermissions(response.data.permissions);
                setVotingStatus(response.data.votingStatus);
                setStats(response.data.stats);
            } else {
                setError('Failed to load booth details');
            }
        } catch (err) {
            console.error('Fetch booth details error:', err);
            
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
                setSuccess('Your vote has been recorded successfully!');
                fetchBoothDetails(); // Refresh data
                setSelectedCandidate(null);
            } else {
                setError(response.error || 'Failed to record vote');
            }
        } catch (err) {
            console.error('Vote error:', err);
            setError(err.message || 'Failed to record vote');
        } finally {
            setVoting(false);
        }
    };

    const handleCopyInviteCode = () => {
        if (booth?.inviteCode) {
            navigator.clipboard.writeText(booth.inviteCode);
            setSuccess('Invite code copied to clipboard!');
        }
    };



    const handleCopyDirectInviteLink = () => {
        if (booth?.inviteCode) {
            const link = `${window.location.origin}/api/booth/invite/${booth.inviteCode}`;
            navigator.clipboard.writeText(link);
            setSuccess('Direct invite link copied to clipboard!');
        }
    };

    const handleShareBooth = async () => {
        if (!booth?.inviteCode) return;
        
        const shareData = {
            title: `Vote in: ${booth.name}`,
            text: `Join the voting booth "${booth.name}" - click to join instantly!`,
            url: `${window.location.origin}/api/booth/invite/${booth.inviteCode}`
        };

        // Check if native share is available (mobile devices)
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                setSuccess('Shared successfully!');
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <div className="mb-6">
                    <BackButton to="/dashboard">Back to Dashboard</BackButton>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{booth?.name}</h1>
                    <p className="text-gray-600 text-lg mb-4">{booth?.description}</p>
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            booth?.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            {booth?.status?.toUpperCase()}
                        </span>
                        
                        {permissions.isCreator && (
                            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                CREATOR
                            </span>
                        )}
                        
                        {permissions.hasVoted && (
                            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                VOTED
                            </span>
                        )}
                        

                    </div>
                </div>

                {/* Alerts */}
                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-teal-100">
                        <div className="text-3xl font-bold text-teal-600 mb-1">{booth?.totalVotes || 0}</div>
                        <div className="text-sm text-gray-600">Total Votes</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-blue-100">
                        <div className="text-3xl font-bold text-blue-600 mb-1">{booth?.members?.length || 0}</div>
                        <div className="text-sm text-gray-600">Members</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-purple-100">
                        <div className="text-3xl font-bold text-purple-600 mb-1">{booth?.candidates?.length || 0}</div>
                        <div className="text-sm text-gray-600">Candidates</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-green-100">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                            {stats?.votingPercentage ? `${Math.round(stats.votingPercentage)}%` : '0%'}
                        </div>
                        <div className="text-sm text-gray-600">Participation</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Voting Status */}
                        {getVotingStatusMessage() && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-amber-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="text-amber-800 font-medium">{getVotingStatusMessage()}</span>
                                </div>
                            </div>
                        )}

                        {/* Voting Interface */}
                        {permissions.canVote && (
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Cast Your Vote</h2>
                                <div className="space-y-4">
                                    {booth?.candidates?.map((candidate, index) => (
                                        <div
                                            key={candidate._id}
                                            className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                                                selectedCandidate === index
                                                    ? 'border-teal-500 bg-teal-50'
                                                    : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                                            }`}
                                            onClick={() => setSelectedCandidate(index)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                                                    {candidate.description && (
                                                        <p className="text-gray-600 mt-1">{candidate.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="candidate"
                                                        value={index}
                                                        checked={selectedCandidate === index}
                                                        onChange={() => setSelectedCandidate(index)}
                                                        className="w-5 h-5 text-teal-600"
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
                                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                                >
                                    Submit Vote
                                </LoadingButton>
                            </div>
                        )}

                        {/* Results Preview */}
                        {(permissions.hasVoted || !permissions.canVote) && booth?.settings?.resultsVisibleToVoters && (
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Results</h2>
                                <div className="space-y-4">
                                    {booth?.candidates?.map((candidate) => {
                                        const percentage = booth.totalVotes > 0 
                                            ? Math.round((candidate.voteCount / booth.totalVotes) * 100) 
                                            : 0;
                                        
                                        return (
                                            <div key={candidate._id} className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-gray-900">{candidate.name}</span>
                                                    <span className="text-gray-600">{candidate.voteCount} votes ({percentage}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div 
                                                        className="bg-gradient-to-r from-teal-500 to-blue-500 h-3 rounded-full transition-all duration-500"
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
                                        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                                    >
                                        View Detailed Results
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Already Voted Message */}
                        {permissions.hasVoted && !booth?.settings?.allowVoteChange && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-green-800 font-medium">
                                        Thank you! Your vote has been recorded successfully.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Booth Info */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booth Information</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created by:</span>
                                    <span className="font-medium">{booth?.creator?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created:</span>
                                    <span className="font-medium">
                                        {booth?.createdAt ? new Date(booth.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Max Members:</span>
                                    <span className="font-medium">{booth?.maxMembers || 'Unlimited'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium">Private</span>
                                </div>
                            </div>
                        </div>

                        {/* Invite Section */}
                        {permissions.isCreator && booth?.inviteCode && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share This Booth</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={booth.inviteCode}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg text-gray-900 font-mono"
                                            />
                                            <button
                                                onClick={handleCopyInviteCode}
                                                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-r-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleCopyDirectInviteLink}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy Invite Link
                                        </button>
                                        <button
                                            onClick={handleShareBooth}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                            </svg>
                                            Share Invite Link
                                        </button>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-sm text-blue-800 font-medium">✨ One-Click Join</p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                Recipients can join instantly by clicking the link. They'll be prompted to login if needed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Admin Actions */}
                        {permissions.isCreator && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate(`/booth/${boothId}/admin`)}
                                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                    >
                                        Manage Booth
                                    </button>
                                    <button
                                        onClick={() => navigate(`/booth/${boothId}/results`)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                    >
                                        View Results
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                >
                                    Back to Dashboard
                                </button>
                                
                                {!permissions.isCreator && (
                                    <button
                                        onClick={() => navigate('/booth/discover')}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                    >
                                        Discover More Booths
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoothDetailPage;
