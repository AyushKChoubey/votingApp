import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Loading } from '../layout/Loading';
import { Alert } from '../layout/Alert';

export function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/dashboard');
            setDashboardData(response.data.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-purple-900 flex items-center justify-center">
                <div className="text-center">
                    <Loading size="lg" color="white" />
                    <p className="text-white mt-4 text-lg">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-purple-900 flex items-center justify-center px-4">
                <div className="text-center">
                    <Alert type="error" message={error} />
                    <button 
                        onClick={fetchDashboardData}
                        className="mt-4 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { createdBooths = [], joinedBooths = [], stats = {} } = dashboardData || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-purple-900 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Welcome back, {user?.name || 'User'}!
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Manage your voting booths and participate in ongoing polls
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">Created Booths</p>
                                <p className="text-2xl font-bold text-white">{stats.totalBooths}</p>
                            </div>
                            <div className="bg-teal-500/20 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">Joined Booths</p>
                                <p className="text-2xl font-bold text-white">{stats.joinedBooths}</p>
                            </div>
                            <div className="bg-green-500/20 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">Total Votes</p>
                                <p className="text-2xl font-bold text-white">{stats.totalVotes}</p>
                            </div>
                            <div className="bg-purple-500/20 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">Active Booths</p>
                                <p className="text-2xl font-bold text-white">{stats.activeBooths}</p>
                            </div>
                            <div className="bg-orange-500/20 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/booth/create"
                            className="bg-gradient-to-r from-teal-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-teal-600 hover:to-purple-600 transition-all transform hover:scale-105 text-center"
                        >
                            <span className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create New Booth
                            </span>
                        </Link>
                        
                        <Link
                            to="/booth/join"
                            className="bg-white/10 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all text-center"
                        >
                            <span className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Join Booth
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Booths Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Created Booths */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Your Booths</h2>
                        {createdBooths.length > 0 ? (
                            <div className="space-y-4">
                                {createdBooths.map((booth) => (
                                    <div key={booth.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-semibold text-white">{booth.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                booth.status === 'active' 
                                                    ? 'bg-green-500/20 text-green-300' 
                                                    : 'bg-gray-500/20 text-gray-300'
                                            }`}>
                                                {booth.status}
                                            </span>
                                        </div>
                                        
                                        <p className="text-gray-300 mb-4 text-sm">{booth.description}</p>
                                        
                                        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                                            <span>{booth.memberCount} members</span>
                                            <span>{booth.totalVotes} votes</span>
                                            <span>{booth.candidateCount} candidates</span>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Link
                                                to={`/booth/${booth.id}`}
                                                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg text-center transition-colors text-sm"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                to={`/booth/${booth.id}/admin`}
                                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-center transition-colors text-sm"
                                            >
                                                Manage
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="text-gray-300 text-lg mb-4">No booths created yet</p>
                                <Link
                                    to="/booth/create"
                                    className="inline-block bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg transition-colors"
                                >
                                    Create Your First Booth
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Joined Booths */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Joined Booths</h2>
                        {joinedBooths.length > 0 ? (
                            <div className="space-y-4">
                                {joinedBooths.map((booth) => (
                                    <div key={booth.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-semibold text-white">{booth.name}</h3>
                                            {booth.hasVoted ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                                                    Voted
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        
                                        <p className="text-gray-300 mb-4 text-sm">{booth.description}</p>
                                        <p className="text-gray-400 mb-4 text-sm">Created by {booth.creator?.name}</p>
                                        
                                        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                                            <span>{booth.memberCount} members</span>
                                            <span className={booth.status === 'active' ? 'text-green-300' : 'text-gray-300'}>
                                                {booth.status}
                                            </span>
                                        </div>
                                        
                                        <Link
                                            to={`/booth/${booth.id}`}
                                            className="block w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-center transition-colors text-sm"
                                        >
                                            {booth.hasVoted ? 'View Results' : 'Vote Now'}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-gray-300 text-lg mb-4">No joined booths yet</p>
                                <Link
                                    to="/booth/join"
                                    className="inline-block bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
                                >
                                    Join a Booth
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}