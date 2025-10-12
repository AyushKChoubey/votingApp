import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Loading, PageLoading, Skeleton, LoadingButton } from '../layout/Loading';
import { Alert } from '../layout/Alert';
import { useToast } from '../layout/Toast';

export function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            
            const response = await api.get('/api/booth/dashboard');
            
            // The API returns { success: true, data: { createdBooths, joinedBooths, stats, user } }
            // The axios interceptor returns response.data directly
            if (response && response.success && response.data) {
                setDashboardData(response.data);
                setError('');
                setLastUpdated(new Date());
            } else {
                console.error('Invalid response structure:', response);
                throw new Error('Invalid response structure from server');
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);



    // Initial load
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Auto-refresh when navigating with refresh state
    useEffect(() => {
        if (location.state?.refresh) {
            fetchDashboardData();
            // Show success message for booth creation
            setTimeout(() => {
                addToast('✓ Booth created! Dashboard updated.', 'success', 3000);
            }, 500);
            // Clear the state to prevent repeated refreshes
            window.history.replaceState({}, document.title);
        }
    }, [location.state, fetchDashboardData, addToast]);

    const copyInviteCode = useCallback(async (inviteCode) => {
        try {
            await navigator.clipboard.writeText(inviteCode);
            addToast(`✓ Invite code ${inviteCode} copied to clipboard!`, 'success', 2000);
        } catch (err) {
            console.error('Copy failed:', err);
            // Fallback for browsers that don't support clipboard API
            try {
                const textArea = document.createElement('textarea');
                textArea.value = inviteCode;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                addToast(`✓ Invite code ${inviteCode} copied!`, 'success', 2000);
            } catch (fallbackErr) {
                addToast('❌ Failed to copy invite code', 'error');
            }
        }
    }, [addToast]);

    const copyInviteLink = useCallback(async (inviteCode) => {
        try {
            const inviteLink = `${window.location.origin}/booth/join/${inviteCode}`;
            await navigator.clipboard.writeText(inviteLink);
            addToast(`✓ Invite link copied to clipboard!`, 'success', 2000);
        } catch (err) {
            console.error('Copy link failed:', err);
            // Fallback for browsers that don't support clipboard API
            try {
                const inviteLink = `${window.location.origin}/booth/join/${inviteCode}`;
                const textArea = document.createElement('textarea');
                textArea.value = inviteLink;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                addToast(`✓ Invite link copied!`, 'success', 2000);
            } catch (fallbackErr) {
                addToast('❌ Failed to copy invite link', 'error');
            }
        }
    }, [addToast]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Loading state with modern skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
                <div className="max-w-7xl mx-auto animate-fadeIn">
                    {/* Header skeleton */}
                    <div className="text-center space-y-4 mb-8">
                        <Skeleton width="w-64" height="h-8" className="mx-auto" />
                        <Skeleton width="w-96" height="h-4" className="mx-auto" />
                    </div>

                    {/* Stats grid skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <Skeleton width="w-16" height="h-16" variant="avatar" className="mx-auto mb-4" />
                                <Skeleton width="w-20" height="h-8" className="mx-auto mb-2" />
                                <Skeleton width="w-32" height="h-4" className="mx-auto" />
                            </div>
                        ))}
                    </div>

                    {/* Booths section skeleton */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <Skeleton width="w-48" height="h-6" className="mb-6" />
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="border border-gray-200 rounded-xl p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2 flex-1">
                                            <Skeleton width="w-48" height="h-5" />
                                            <Skeleton width="w-96" height="h-4" />
                                        </div>
                                        <Skeleton width="w-20" height="h-6" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !dashboardData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <Alert type="error" message={error} />
                    <button 
                        onClick={() => fetchDashboardData()}
                        className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const { createdBooths = [], joinedBooths = [], stats = {}, user: userData = {} } = dashboardData || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-3 px-3 sm:py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header - Mobile Optimized */}
                <div className="mb-4 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                                Welcome back, {(userData.name || user?.name || 'User').split(' ')[0]}!
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                                Manage your booths and participate in polls
                            </p>
                            {/* {lastUpdated && (
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                </p>
                            )} */}
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Mobile Optimized */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
                    <StatsCard
                        title="Created Booths"
                        value={stats.totalBooths || 0}
                        icon="booth"
                        color="teal"
                    />
                    <StatsCard
                        title="Joined Booths"
                        value={stats.joinedBooths || 0}
                        icon="users"
                        color="green"
                    />
                    <StatsCard
                        title="Total Votes"
                        value={stats.totalVotes || 0}
                        icon="votes"
                        color="purple"
                    />
                    <StatsCard
                        title="Active Booths"
                        value={stats.activeBooths || 0}
                        icon="active"
                        color="orange"
                    />
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/booth/create"
                            onClick={() => addToast('🚀 Redirecting to booth creation...', 'info', 1500)}
                            className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-center shadow-lg flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Booth
                        </Link>
                        
                        <Link
                            to="/booth/join"
                            className="bg-gradient-to-r from-white to-gray-50 text-gray-700 py-3 px-6 rounded-xl font-semibold border border-gray-300 hover:border-green-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-300 hover:shadow-xl text-center shadow-lg flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Join a Booth
                        </Link>


                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Created Booths */}
                    <div className="flex flex-col h-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            My Booths
                            <span className="bg-teal-100 text-teal-800 text-sm px-2 py-1 rounded-full">
                                {createdBooths?.length || 0}
                            </span>
                        </h2>
                        
                        {createdBooths && createdBooths.length > 0 ? (
                            <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300">
                                <div className="px-5 py-3 border-b border-blue-200 bg-gradient-to-r from-blue-100/70 to-indigo-100/70 rounded-t-xl">
                                    <h3 className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                                        </svg>
                                        Created Booths
                                    </h3>
                                </div>
                                <div className="h-96 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 hover:scrollbar-thumb-blue-500">
                                    {createdBooths.map((booth) => (
                                        <CreatedBoothCard
                                            key={booth.id}
                                            booth={booth}
                                            onCopyInviteCode={copyInviteCode}
                                            onCopyInviteLink={copyInviteLink}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="No booths created yet"
                                description="Create your first voting booth to get started"
                                actionText="Create Your First Booth"
                                actionLink="/booth/create"
                                icon="booth"
                            />
                        )}
                    </div>

                    {/* Joined Booths */}
                    <div className="flex flex-col h-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            Joined Booths
                            <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                                {joinedBooths?.length || 0}
                            </span>
                        </h2>
                        
                        {joinedBooths && joinedBooths.length > 0 ? (
                            <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-300">
                                <div className="px-5 py-3 border-b border-green-200 bg-gradient-to-r from-green-100/70 to-emerald-100/70 rounded-t-xl">
                                    <h3 className="text-sm font-medium text-green-700 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                        </svg>
                                        Joined Booths
                                    </h3>
                                </div>
                                <div className="h-96 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-green-400 scrollbar-track-green-100 hover:scrollbar-thumb-green-500">
                                    {joinedBooths.map((booth) => (
                                        <JoinedBoothCard
                                            key={booth.id}
                                            booth={booth}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="No joined booths yet"
                                description="Join a voting booth to participate in polls"
                                actionText="Join a Booth"
                                actionLink="/booth/join"
                                icon="users"
                            />
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-6">
                        <Alert type="warning" message={`Warning: ${error}`} />
                    </div>
                )}
            </div>
        </div>
    );
}

// Stats Card Component
function StatsCard({ title, value, icon, color, refreshing }) {
    const colorClasses = {
        teal: 'bg-teal-100 text-teal-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600'
    };

    const icons = {
        booth: (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        users: (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        votes: (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        active: (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        )
    };

    return (
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                    <p className="text-gray-600 text-xs sm:text-sm truncate">{title}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {refreshing ? (
                            <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-8 sm:w-12 rounded"></div>
                        ) : (
                            value
                        )}
                    </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colorClasses[color]} flex-shrink-0 ml-2`}>
                    {icons[icon]}
                </div>
            </div>
        </div>
    );
}

// Created Booth Card Component
function CreatedBoothCard({ booth, onCopyInviteCode, onCopyInviteLink, formatDate }) {
    const [showInviteOptions, setShowInviteOptions] = useState(false);
    return (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-3 sm:p-4 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">{booth.name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
                        <span className="truncate">Created {formatDate(booth.createdAt)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">#{booth.inviteCode}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booth.status === 'active' 
                            ? 'bg-green-100 text-green-600' 
                            : booth.status === 'closed'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                        {booth.status?.charAt(0).toUpperCase() + booth.status?.slice(1) || 'Active'}
                    </span>
                </div>
            </div>
            
            {booth.description && (
                <p className="text-gray-600 mb-3 text-xs sm:text-sm line-clamp-1 sm:line-clamp-2">{booth.description}</p>
            )}
            
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 bg-gray-50 rounded-md p-2">
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                    </svg>
                    <span className="hidden sm:inline">{booth.memberCount || 0} members</span>
                    <span className="sm:hidden">{booth.memberCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="hidden sm:inline">{booth.totalVotes || 0} votes</span>
                    <span className="sm:hidden">{booth.totalVotes || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                    </svg>
                    <span className="hidden sm:inline">{booth.candidateCount || 0} candidates</span>
                    <span className="sm:hidden">{booth.candidateCount || 0}</span>
                </div>
            </div>
            
            <div className="flex gap-1 sm:gap-2">
                <Link
                    to={`/booth/${booth.id}`}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-center transition-all duration-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="hidden sm:inline">Vote</span>
                </Link>
                <Link
                    to={`/booth/${booth.id}/admin`}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-center transition-all duration-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden sm:inline">Manage</span>
                </Link>
                <div className="relative">
                    <button
                        onClick={() => setShowInviteOptions(!showInviteOptions)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-center transition-all duration-200 text-xs sm:text-sm font-medium flex items-center gap-1"
                        title="Invite options"
                    >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {showInviteOptions && (
                        <div className="absolute right-0 mt-2 w-44 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        onCopyInviteCode(booth.inviteCode);
                                        setShowInviteOptions(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy Code
                                    <span className="ml-auto text-xs font-mono text-gray-500">{booth.inviteCode}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        onCopyInviteLink(booth.inviteCode);
                                        setShowInviteOptions(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Joined Booth Card Component
function JoinedBoothCard({ booth }) {
    return (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-lg p-3 sm:p-4 border border-gray-100 hover:border-green-200 hover:bg-gradient-to-br hover:from-white hover:to-green-50/30 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">{booth.name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
                        <span className="truncate">Created by {booth.creator?.name || 'Anonymous'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className={booth.status === 'active' ? 'text-green-600 font-medium' : 'text-gray-500'}>
                            {booth.status?.charAt(0).toUpperCase() + booth.status?.slice(1) || 'Active'}
                        </span>
                    </div>
                </div>
                <div className="flex sm:flex-col items-start sm:items-end gap-2">
                    {booth.hasVoted ? (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Voted
                        </span>
                    ) : (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Pending
                        </span>
                    )}
                </div>
            </div>
            
            <p className="text-gray-600 mb-3 text-xs sm:text-sm line-clamp-2">{booth.description}</p>
            
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 bg-gray-50 rounded-lg p-2">
                <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                    </svg>
                    <span>{booth.memberCount || 0} <span className="hidden sm:inline">members</span></span>
                </div>
                {booth.hasVoted && (
                    <div className="flex items-center gap-1 text-green-600">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="hidden sm:inline">Vote submitted</span>
                    </div>
                )}
            </div>
            
            <Link
                to={`/booth/${booth.id}`}
                className={`block w-full py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg sm:rounded-xl text-center transition-all duration-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-2 ${
                    booth.hasVoted 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
                {booth.hasVoted ? (
                    <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="hidden sm:inline">View Results</span>
                        <span className="sm:hidden">Results</span>
                    </>
                ) : (
                    <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="hidden sm:inline">Vote Now</span>
                        <span className="sm:hidden">Vote</span>
                    </>
                )}
            </Link>
        </div>
    );
}

// Empty State Component
function EmptyState({ title, description, actionText, actionLink, icon }) {
    const icons = {
        booth: (
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        users: (
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        )
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
            {icons[icon]}
            <p className="text-gray-600 text-lg mb-4">{title}</p>
            <p className="text-gray-500 text-sm mb-6">{description}</p>
            <Link
                to={actionLink}
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-xl transition-all duration-300 font-semibold"
            >
                {actionText}
            </Link>
        </div>
    );
}
