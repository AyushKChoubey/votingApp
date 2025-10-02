import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../../services/api';
import { Alert } from '../layout/Alert';
import { Loading } from '../layout/Loading';

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-purple-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Join Booth</h1>
                    <p className="text-gray-300 text-lg">Enter an invite code to join a voting booth</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    {error && <Alert type="error" message={error} />}
                    {success && <Alert type="success" message={success} />}

                    {!booth ? (
                        <form onSubmit={handleCodeSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-200 mb-2">
                                    Invite Code
                                </label>
                                <input
                                    id="inviteCode"
                                    type="text"
                                    required
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all text-center text-2xl font-mono tracking-wider"
                                    placeholder="ABCD123"
                                    maxLength="10"
                                />
                                <p className="text-gray-400 text-sm mt-2 text-center">
                                    Enter the invite code provided by the booth creator
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !inviteCode.trim()}
                                className="w-full bg-gradient-to-r from-teal-500 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-teal-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                            >
                                {loading ? <Loading size="sm" color="white" /> : 'Find Booth'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {/* Booth Information */}
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-white">{booth.name}</h2>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        booth.status === 'active' 
                                            ? 'bg-green-500/20 text-green-300' 
                                            : 'bg-gray-500/20 text-gray-300'
                                    }`}>
                                        {booth.status}
                                    </span>
                                </div>
                                
                                <p className="text-gray-300 mb-4">{booth.description}</p>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <div className="text-gray-400">Created by</div>
                                        <div className="text-white font-medium">{booth.creator?.name}</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg">
                                        <div className="text-gray-400">Members</div>
                                        <div className="text-white font-medium">{booth.memberCount} joined</div>
                                    </div>
                                </div>
                            </div>

                            {/* Join Confirmation */}
                            <div className="text-center">
                                <p className="text-gray-300 mb-6">
                                    Are you sure you want to join this voting booth?
                                </p>
                                
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => {
                                            setBooth(null);
                                            setInviteCode('');
                                        }}
                                        className="flex-1 bg-white/10 text-white py-3 px-4 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
                                    >
                                        Back
                                    </button>
                                    
                                    <button
                                        onClick={handleJoinBooth}
                                        disabled={joining || booth.status !== 'active'}
                                        className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                                    >
                                        {joining ? <Loading size="sm" color="white" /> : 'Join Booth'}
                                    </button>
                                </div>
                                
                                {booth.status !== 'active' && (
                                    <p className="text-orange-300 text-sm mt-4">
                                        This booth is currently inactive and cannot accept new members.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-gray-300 hover:text-white transition-colors text-sm"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}