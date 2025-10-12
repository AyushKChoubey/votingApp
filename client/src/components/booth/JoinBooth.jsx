import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../../services/api';
import { Alert } from '../layout/Alert';
import { LoadingButton } from '../layout/Loading';

export function JoinBooth() {
    const [inviteCode, setInviteCode] = useState('');
    const [booth, setBooth] = useState(null);
    const [loading, setLoading] = useState(false);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const navigate = useNavigate();
    const { code } = useParams();

    useEffect(() => {
        if (code) {
            setInviteCode(code.toUpperCase());
            checkInviteCode(code);
        }
    }, [code]);

    const checkInviteCode = async (codeToCheck) => {
        if (!codeToCheck || codeToCheck.length < 4) return;
        
        setLoading(true);
        setError('');
        
        try {
            const response = await api.get(`/booth/api/join/${codeToCheck.toUpperCase()}`);
            const { booth, isMember, isCreator } = response.data.data;
            
            if (isMember || isCreator) {
                navigate(`/booth/${booth.id}`);
                return;
            }
            
            setBooth(booth);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid invite code');
            setBooth(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        checkInviteCode(inviteCode);
    };

    const handleJoinBooth = async () => {
        if (!booth) return;
        
        setJoining(true);
        setError('');
        
        try {
            await api.post(`/booth/api/join/${inviteCode}`);
            setSuccess('Successfully joined the booth!');
            setTimeout(() => {
                navigate(`/booth/${booth.id}`);
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to join booth');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Join Booth</h1>
                    <p className="text-gray-600 text-lg">Enter an invite code to join a voting booth</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {error && <Alert type="error" message={error} />}
                    {success && <Alert type="success" message={success} />}

                    {!booth ? (
                        <form onSubmit={handleCodeSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                                    Invite Code
                                </label>
                                <input
                                    id="inviteCode"
                                    type="text"
                                    required
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all text-center text-2xl font-mono tracking-wider"
                                    placeholder="ABCD123"
                                    maxLength="10"
                                />
                                <p className="text-gray-500 text-sm mt-2 text-center">
                                    Enter the invite code provided by the booth creator
                                </p>
                            </div>

                            <LoadingButton
                                type="submit"
                                loading={loading}
                                disabled={!inviteCode.trim()}
                                variant="teal"
                                size="lg"
                                className="w-full"
                            >
                                Find Booth
                            </LoadingButton>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {/* Booth Information */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">{booth.name}</h2>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        booth.status === 'active' 
                                            ? 'bg-green-100 text-green-600' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {booth.status}
                                    </span>
                                </div>
                                
                                <p className="text-gray-600 mb-4">{booth.description}</p>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="text-gray-500">Created by</div>
                                        <div className="text-gray-900 font-medium">{booth.creator?.name}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="text-gray-500">Members</div>
                                        <div className="text-gray-900 font-medium">{booth.memberCount} joined</div>
                                    </div>
                                </div>
                            </div>

                            {/* Join Confirmation */}
                            <div className="text-center">
                                <p className="text-gray-600 mb-6">
                                    Are you sure you want to join this voting booth?
                                </p>
                                
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => {
                                            setBooth(null);
                                            setInviteCode('');
                                        }}
                                        className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                                    >
                                        Back
                                    </button>
                                    
                                    <LoadingButton
                                        onClick={handleJoinBooth}
                                        loading={joining}
                                        disabled={booth.status !== 'active'}
                                        variant="green"
                                        size="lg"
                                        className="flex-1"
                                    >
                                        Join Booth
                                    </LoadingButton>
                                </div>
                                
                                {booth.status !== 'active' && (
                                    <p className="text-orange-600 text-sm mt-4">
                                        This booth is currently inactive and cannot accept new members.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}