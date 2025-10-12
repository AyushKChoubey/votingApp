import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { boothService } from '../../services/api';
import { Alert } from '../../components/layout/Alert';
import { LoadingButton } from '../../components/layout/Loading';

const JoinBoothPage = () => {
    const [inviteCode, setInviteCode] = useState('');
    const [booth, setBooth] = useState(null);

    const [loading, setLoading] = useState(false);

    const [joining, setJoining] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    
    const navigate = useNavigate();
    const { code } = useParams();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (code) {
            setInviteCode(code.toUpperCase());
            // Auto-check the invite code from the URL
            checkInviteCode(code);
        }

        // Handle error messages from direct invite links
        const error = searchParams.get('error');
        const joined = searchParams.get('joined');
        
        if (error) {
            const errorMessages = {
                'invalid_code': 'Invalid invite code',
                'booth_full': 'This booth is full and cannot accept more members',
                'booth_inactive': 'This booth is not currently active',
                'domain_restricted': 'Your email domain is not allowed to join this booth',
                'join_failed': 'Failed to join booth. Please try again.',
                'server_error': 'Server error occurred. Please try again later.'
            };
            setError(errorMessages[error] || 'An error occurred while joining the booth');
        }
        
        if (joined === 'true') {
            setSuccess('Successfully joined the booth!');
        }
    }, [code, searchParams]);



    const checkInviteCode = async (codeToCheck) => {
        if (!codeToCheck || codeToCheck.length < 4) return;
        
        setLoading(true);
        setError('');
        setBooth(null);
        
        try {
            const response = await api.get(`/api/booth/join/${codeToCheck.toUpperCase()}`);
            
            if (response.success && response.data) {
                const { booth: boothData, isMember, isCreator } = response.data;
                
                if (isMember || isCreator) {
                    navigate(`/booth/${boothData.id}`);
                    return;
                }
                
                setBooth(boothData);
            } else {
                setError('Invalid invite code');
            }
        } catch (err) {
            console.error('Check invite code error:', err);
            setError(err.message || 'Invalid invite code');
            setBooth(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        if (inviteCode.trim()) {
            checkInviteCode(inviteCode.trim());
        }
    };

    const handleJoinBooth = async () => {
        if (!booth) return;
        
        try {
            setJoining(true);
            setError('');
            
            const response = await boothService.joinBooth(inviteCode);
            
            if (response.success) {
                setSuccess('Successfully joined the booth!');
                setTimeout(() => {
                    // Use the boothId from the join response instead of the booth object
                    navigate(`/booth/${response.boothId || booth.id}`);
                }, 1500);
            } else {
                setError(response.error || 'Failed to join booth');
            }
        } catch (err) {
            console.error('Join booth error:', err);
            setError(err.message || 'Failed to join booth');
        } finally {
            setJoining(false);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Join a Booth</h1>
                    <p className="text-gray-600 text-lg mb-4">Enter an invite code to join a booth</p>
                    
                    {/* How to Join Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl mx-auto">
                        <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 How to Join:</h3>
                        <div className="grid md:grid-cols-2 gap-3 text-xs text-blue-700">
                            <div className="flex items-start gap-2">
                                <span className="text-blue-600">🔗</span>
                                <span><strong>Direct Link:</strong> Click the invite link shared by the booth creator</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-blue-600">🔤</span>
                                <span><strong>Manual Entry:</strong> Enter the invite code below</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}

                {/* Invite Code Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
                    <div className="p-8">
                        <div className="max-w-md mx-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                {code ? 'Invite Code from Link' : 'Enter Invite Code'}
                            </h2>
                            
                            {code && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-center">
                                    <span className="text-green-700 text-sm">
                                        ✓ Code detected from invite link: <strong>{code}</strong>
                                    </span>
                                </div>
                            )}
                            
                            <form onSubmit={handleCodeSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                                            Booth Invite Code
                                        </label>
                                        <input
                                            id="inviteCode"
                                            type="text"
                                            value={inviteCode}
                                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                            placeholder="Enter 6-8 character code"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 font-mono text-center text-lg tracking-wider"
                                            maxLength={8}
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                            Ask the booth creator for the invite code
                                        </p>
                                    </div>
                                    
                                    <LoadingButton
                                        type="submit"
                                        loading={loading}
                                        disabled={!inviteCode.trim() || inviteCode.length < 4}
                                        variant="teal"
                                        size="lg"
                                        className="w-full py-3"
                                    >
                                        Check Invite Code
                                    </LoadingButton>
                            </form>

                            {/* Booth Preview */}
                            {booth && (
                                <div className="max-w-md mx-auto mt-8">
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                        <div className="text-center mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">{booth.name}</h3>
                                            <p className="text-gray-600 text-sm mt-1">{booth.description}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 text-sm text-center mb-4">
                                            <div className="bg-white rounded-lg p-3">
                                                <div className="font-semibold text-gray-900">{booth.memberCount || 0}</div>
                                                <div className="text-gray-600">Members</div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3">
                                                <div className="font-semibold text-gray-900">{booth.creator?.name}</div>
                                                <div className="text-gray-600">Created by</div>
                                            </div>
                                        </div>
                                        
                                        <LoadingButton
                                            onClick={handleJoinBooth}
                                            loading={joining}
                                            variant="green"
                                            size="lg"
                                            className="w-full py-3"
                                        >
                                            Join This Booth
                                        </LoadingButton>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="text-center">
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/booth/create')}
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
                        >
                            Create New Booth
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JoinBoothPage;
