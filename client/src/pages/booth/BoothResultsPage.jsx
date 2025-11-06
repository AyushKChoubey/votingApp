import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { boothService } from '../../services/api';
import { Alert } from '../../components/layout/Alert';
import { LoadingButton, PageLoading } from '../../components/layout/Loading';
import BackButton from '../../components/layout/BackButton';
import { useToast } from '../../components/layout/Toast';

const BoothResultsPage = () => {
    const { boothId } = useParams();
    const navigate = useNavigate();
    
    const [booth, setBooth] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { addToast } = useToast();

    useEffect(() => {
        fetchBoothDetails();
    }, [boothId]);

    const fetchBoothDetails = async () => {
        try {
            setLoading(true);
            const response = await boothService.getBooth(boothId);
            
            if (response.success && response.data) {
                setBooth(response.data.booth);
                setPermissions(response.data.permissions);
                
                // Check if user can view results
                if (!response.data.permissions.isCreator && 
                    !response.data.permissions.hasVoted && 
                    !response.data.booth.settings?.resultsVisibleToVoters) {
                    setError('You need to vote or be the booth creator to view results');
                    return;
                }
            } else {
                setError('Failed to load booth results');
            }
        } catch (err) {
            console.error('Fetch booth results error:', err);
            if (err.status === 403) {
                setError('You are not authorized to view results for this booth');
            } else if (err.status === 404) {
                setError('Booth not found');
            } else {
                setError('Failed to load booth results');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrintResults = () => {
        try {
            setError('');
            
            // Create a new window with only the results content
            const printWindow = window.open('', '_blank');
            const resultsContent = document.querySelector('.results-print-content');
            
            if (!resultsContent) {
                setError('Unable to find results content for printing');
                return;
            }
            
            // Build the print document with only the results
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${booth?.name || 'Booth'} - Results</title>
                    <style>
                        body { 
                            font-family: system-ui, -apple-system, sans-serif; 
                            margin: 0; 
                            padding: 20px; 
                            background: white;
                            color: #111827;
                            line-height: 1.5;
                        }
                        .results-header {
                            text-align: center;
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid #e5e7eb;
                        }
                        .results-title { 
                            font-size: 2rem; 
                            font-weight: bold; 
                            margin-bottom: 10px;
                            color: #111827;
                        }
                        .results-subtitle {
                            font-size: 1.1rem;
                            color: #6b7280;
                            margin-bottom: 15px;
                        }
                        .summary-stats {
                            display: grid;
                            grid-template-columns: repeat(4, 1fr);
                            gap: 15px;
                            margin-bottom: 30px;
                        }
                        .stat-card {
                            text-align: center;
                            padding: 15px;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                        }
                        .stat-value { 
                            font-size: 1.8rem; 
                            font-weight: bold; 
                            margin-bottom: 5px;
                        }
                        .stat-label { 
                            font-size: 0.9rem; 
                            color: #6b7280;
                        }
                        .winner-section {
                            background: #fef3c7;
                            border: 2px solid #f59e0b;
                            border-radius: 12px;
                            padding: 25px;
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .winner-title {
                            font-size: 1.8rem;
                            font-weight: bold;
                            margin-bottom: 10px;
                            color: #92400e;
                        }
                        .winner-name {
                            font-size: 1.5rem;
                            font-weight: bold;
                            margin-bottom: 8px;
                            color: #92400e;
                        }
                        .candidate-list {
                            space-y: 15px;
                        }
                        .candidate-item {
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            padding: 20px;
                            margin-bottom: 15px;
                        }
                        .candidate-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                        }
                        .candidate-name {
                            font-size: 1.2rem;
                            font-weight: bold;
                        }
                        .candidate-votes {
                            font-size: 1.1rem;
                            font-weight: bold;
                        }
                        .progress-bar {
                            width: 100%;
                            height: 12px;
                            background-color: #e5e7eb;
                            border-radius: 6px;
                            overflow: hidden;
                        }
                        .progress-fill {
                            height: 100%;
                            background-color: #059669;
                            border-radius: 6px;
                            transition: width 0.3s ease;
                        }
                        @media print {
                            body { margin: 0; }
                            .summary-stats { grid-template-columns: repeat(2, 1fr); }
                        }
                    </style>
                </head>
                <body>
                    <div class="results-header">
                        <div class="results-title">Election Results</div>
                        <div class="results-subtitle">${booth?.name || 'Voting Booth'}</div>
                        <div style="font-size: 0.9rem; color: #6b7280;">
                            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                        </div>
                    </div>
                    
                    <div class="summary-stats">
                        <div class="stat-card">
                            <div class="stat-value">${booth?.totalVotes || 0}</div>
                            <div class="stat-label">Total Votes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${booth?.members?.length || 0}</div>
                            <div class="stat-label">Eligible Voters</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${getTurnout()}%</div>
                            <div class="stat-label">Voter Turnout</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${booth?.candidates?.length || 0}</div>
                            <div class="stat-label">Candidates</div>
                        </div>
                    </div>
                    
                    ${winner && booth?.totalVotes > 0 ? `
                    <div class="winner-section">
                        <div class="winner-title">🏆 Winner</div>
                        <div class="winner-name">${winner.name}</div>
                        <div>${winner.voteCount} votes (${calculatePercentage(winner.voteCount, booth.totalVotes)}%)</div>
                        ${winner.description ? `<div style="margin-top: 10px; color: #92400e;">${winner.description}</div>` : ''}
                    </div>
                    ` : ''}
                    
                    <div class="candidate-list">
                        ${booth?.candidates?.sort((a, b) => b.voteCount - a.voteCount)?.map((candidate, index) => {
                            const percentage = calculatePercentage(candidate.voteCount, booth.totalVotes);
                            const isWinner = candidate._id === winner?._id;
                            return `
                            <div class="candidate-item" style="${isWinner ? 'border-color: #f59e0b; background-color: #fef3c7;' : ''}">
                                <div class="candidate-header">
                                    <div>
                                        <div class="candidate-name" style="${isWinner ? 'color: #92400e;' : ''}">${index + 1}. ${candidate.name} ${isWinner ? '👑' : ''}</div>
                                        ${candidate.description ? `<div style="font-size: 0.9rem; color: #6b7280; margin-top: 5px;">${candidate.description}</div>` : ''}
                                    </div>
                                    <div class="candidate-votes" style="${isWinner ? 'color: #92400e;' : ''}">
                                        ${candidate.voteCount} votes (${percentage}%)
                                    </div>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percentage}%; ${isWinner ? 'background-color: #f59e0b;' : ''}"></div>
                                </div>
                            </div>
                            `;
                        }).join('') || '<div style="text-align: center; padding: 40px; color: #6b7280;">No votes cast yet</div>'}
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            
            // Wait for content to load then print
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 250);

            // Use the global toast system instead of an inline alert
            try { addToast('PDF export initiated. Check your printer dialog.', 'success'); } catch (e) { /* no-op if toast unavailable */ }
        } catch (err) {
            console.error('Print error:', err);
            setError('Failed to generate PDF export');
        }
    };

    const calculatePercentage = (voteCount, totalVotes) => {
        return totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    };

    const getWinner = () => {
        if (!booth?.candidates || booth.candidates.length === 0) return null;
        return booth.candidates.reduce((winner, candidate) => 
            candidate.voteCount > (winner?.voteCount || 0) ? candidate : winner
        );
    };

    const getTurnout = () => {
        if (!booth?.members || booth.members.length === 0) return 0;
        const votersCount = booth.members.filter(member => member.hasVoted).length;
        return Math.round((votersCount / booth.members.length) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center">
                <div className="text-center">
                    <PageLoading size="lg" color="teal" />
                    <p className="text-gray-700 mt-4 text-lg">Loading results...</p>
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
                                onClick={() => navigate(`/booth/${boothId}`)}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
                            >
                                Back to Booth
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

    const winner = getWinner();
    const turnout = getTurnout();

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header (no card) - compact header: back left, title center, actions right */}
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
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Results</h1>
                            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">{booth?.name}</p>
                        </div>

                        <div className="w-20 sm:w-24 flex-shrink-0 flex items-start justify-end">
                            {permissions.isCreator && (
                                <button
                                    onClick={() => navigate(`/booth/${boothId}/admin`)}
                                    className="text-sm px-2 py-1 md:px-3 md:py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
                                >
                                    <span className="hidden sm:inline">Manage</span>
                                    <span className="sm:hidden">Admin</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}

                {/* Quick Stats - Mobile Responsive */}
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
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1">{booth?.members?.length || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-600 font-medium">Eligible Voters</div>
                    </div>
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl p-4 sm:p-6 text-center border border-gray-100 transition-all duration-300 hover:scale-105 hover:border-green-200 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 group">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">{turnout}%</div>
                        <div className="text-xs sm:text-sm text-gray-600 font-medium">Voter Turnout</div>
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Results */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Winner Announcement */}
                        {winner && booth?.totalVotes > 0 && (
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-white">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-yellow-200" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 2L13.09 8.26L20 9L15 13.74L16.18 20.02L10 16.77L3.82 20.02L5 13.74L0 9L6.91 8.26L10 2Z" clipRule="evenodd" />
                                    </svg>
                                    <h2 className="text-3xl font-bold mb-2">Winner!</h2>
                                    <h3 className="text-2xl font-semibold mb-2">{winner.name}</h3>
                                    <p className="text-lg">
                                        {winner.voteCount} votes ({calculatePercentage(winner.voteCount, booth.totalVotes)}%)
                                    </p>
                                    {winner.description && (
                                        <p className="text-yellow-100 mt-2 opacity-90">{winner.description}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Detailed Results */}
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 results-print-content">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Detailed Results</h3>
                            
                            {booth?.totalVotes === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">No votes yet</h4>
                                    <p className="text-gray-600">Be the first to vote in this booth!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {booth?.candidates
                                        ?.sort((a, b) => b.voteCount - a.voteCount)
                                        ?.map((candidate, index) => {
                                            const percentage = calculatePercentage(candidate.voteCount, booth.totalVotes);
                                            const isWinner = candidate._id === winner?._id;
                                            
                                            return (
                                                <div key={candidate._id} className={`border-2 rounded-xl p-4 sm:p-6 transition-all ${
                                                    isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'
                                                }`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                                                isWinner ? 'bg-yellow-500' : index === 0 ? 'bg-gold' : index === 1 ? 'bg-silver' : index === 2 ? 'bg-bronze' : 'bg-gray-500'
                                                            }`}>
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className={`text-lg font-semibold ${isWinner ? 'text-yellow-800' : 'text-gray-900'}`}>
                                                                    {candidate.name}
                                                                    {isWinner && (
                                                                        <svg className="w-5 h-5 inline ml-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 2L13.09 8.26L20 9L15 13.74L16.18 20.02L10 16.77L3.82 20.02L5 13.74L0 9L6.91 8.26L10 2Z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </h4>
                                                                {candidate.description && (
                                                                    <p className="text-sm text-gray-600">{candidate.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-2xl font-bold ${isWinner ? 'text-yellow-700' : 'text-gray-900'}`}>
                                                                {candidate.voteCount}
                                                            </div>
                                                            <div className={`text-sm ${isWinner ? 'text-yellow-600' : 'text-gray-600'}`}>
                                                                {percentage}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                                        <div 
                                                            className={`h-4 rounded-full transition-all duration-1000 ${
                                                                isWinner ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                                                                index === 0 ? 'bg-gradient-to-r from-teal-500 to-blue-500' :
                                                                index === 1 ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                                                                'bg-gradient-to-r from-gray-400 to-gray-500'
                                                            }`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Export Options */}
                        {permissions.isCreator && (
                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 no-print">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Results</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={handlePrintResults}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Export as PDF
                                    </button>

                                    <p className="text-xs text-gray-500 mt-2">Generates a clean PDF of just the results section without browser chrome or sidebars.</p>
                                </div>
                            </div>
                        )}

                        {/* Booth Info */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booth Information</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Creator:</span>
                                    <span className="font-medium">{booth?.creator?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created:</span>
                                    <span className="font-medium">
                                        {booth?.createdAt ? new Date(booth.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-medium capitalize ${
                                        booth?.status === 'active' ? 'text-green-600' : 'text-gray-600'
                                    }`}>
                                        {booth?.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium">
                                        Private
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Voting Statistics */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Statistics</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Voter Turnout</span>
                                        <span className="font-medium">{turnout}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${turnout}%` }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="font-semibold text-gray-900">{booth?.members?.filter(m => m.hasVoted).length || 0}</div>
                                        <div className="text-gray-600">Voted</div>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="font-semibold text-gray-900">
                                            {(booth?.members?.length || 0) - (booth?.members?.filter(m => m.hasVoted).length || 0)}
                                        </div>
                                        <div className="text-gray-600">Not Voted</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/booth/${boothId}`)}
                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                >
                                    View Booth
                                </button>
                                
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                >
                                    Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default BoothResultsPage;
