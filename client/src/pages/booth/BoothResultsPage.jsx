import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { boothService } from '../../services/api';
import { Alert } from '../../components/layout/Alert';
import { LoadingButton, PageLoading } from '../../components/layout/Loading';
import BackButton from '../../components/layout/BackButton';

const BoothResultsPage = () => {
    const { boothId } = useParams();
    const navigate = useNavigate();
    
    const [booth, setBooth] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    const handleExport = async (format) => {
        try {
            setExporting(format);
            setError('');
            
            const response = await boothService.exportData(boothId, format);
            
            // Create blob and download
            const blob = new Blob([response.data], { 
                type: format === 'csv' ? 'text/csv' : 'application/json' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${booth.name}_results.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            setSuccess(`Results exported as ${format.toUpperCase()} successfully!`);
        } catch (err) {
            console.error('Export error:', err);
            setError(err.message || `Failed to export as ${format.toUpperCase()}`);
        } finally {
            setExporting('');
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
                {/* Back Button */}
                <div className="mb-6">
                    <BackButton to={`/booth/${boothId}`}>Back to Booth</BackButton>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Election Results</h1>
                    <h2 className="text-xl text-gray-600 mb-4">{booth?.name}</h2>
                    
                    {/* Navigation */}
                    <div className="flex justify-center space-x-4 mb-6">
                        <button
                            onClick={() => navigate(`/booth/${boothId}`)}
                            className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                        >
                            Back to Booth
                        </button>
                        {permissions.isCreator && (
                            <button
                                onClick={() => navigate(`/booth/${boothId}/admin`)}
                                className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                            >
                                Manage Booth
                            </button>
                        )}
                    </div>
                </div>

                {/* Alerts */}
                {error && <Alert type="error" message={error} />}
                {success && <Alert type="success" message={success} />}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                    {/* Summary Cards */}
                    <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-teal-100">
                        <div className="text-3xl font-bold text-teal-600 mb-1">{booth?.totalVotes || 0}</div>
                        <div className="text-sm text-gray-600">Total Votes</div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-blue-100">
                        <div className="text-3xl font-bold text-blue-600 mb-1">{booth?.members?.length || 0}</div>
                        <div className="text-sm text-gray-600">Eligible Voters</div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-green-100">
                        <div className="text-3xl font-bold text-green-600 mb-1">{turnout}%</div>
                        <div className="text-sm text-gray-600">Voter Turnout</div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-purple-100">
                        <div className="text-3xl font-bold text-purple-600 mb-1">{booth?.candidates?.length || 0}</div>
                        <div className="text-sm text-gray-600">Candidates</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Results */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Winner Announcement */}
                        {winner && booth?.totalVotes > 0 && (
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-8 text-white">
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
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Detailed Results</h3>
                            
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
                                                <div key={candidate._id} className={`border-2 rounded-xl p-6 transition-all ${
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

                        {/* Vote Distribution Chart */}
                        {booth?.totalVotes > 0 && (
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Vote Distribution</h3>
                                
                                <div className="flex flex-wrap justify-center gap-4 mb-6">
                                    {booth?.candidates?.map((candidate, index) => {
                                        const percentage = calculatePercentage(candidate.voteCount, booth.totalVotes);
                                        const colors = [
                                            'bg-teal-500',
                                            'bg-blue-500',
                                            'bg-purple-500',
                                            'bg-pink-500',
                                            'bg-indigo-500',
                                            'bg-green-500'
                                        ];
                                        
                                        return (
                                            <div key={candidate._id} className="flex items-center space-x-2">
                                                <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    {candidate.name} ({percentage}%)
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Simple Pie Chart Representation */}
                                <div className="flex justify-center">
                                    <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200 relative">
                                        {booth?.candidates?.map((candidate, index) => {
                                            const percentage = calculatePercentage(candidate.voteCount, booth.totalVotes);
                                            const colors = [
                                                'bg-teal-500',
                                                'bg-blue-500',
                                                'bg-purple-500',
                                                'bg-pink-500',
                                                'bg-indigo-500',
                                                'bg-green-500'
                                            ];
                                            
                                            return percentage > 0 && (
                                                <div
                                                    key={candidate._id}
                                                    className={`absolute inset-0 ${colors[index % colors.length]}`}
                                                    style={{
                                                        clipPath: `polygon(50% 50%, 50% 0%, ${
                                                            50 + 50 * Math.cos((percentage / 100) * 2 * Math.PI - Math.PI / 2)
                                                        }% ${
                                                            50 + 50 * Math.sin((percentage / 100) * 2 * Math.PI - Math.PI / 2)
                                                        }%, 50% 50%)`
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Export Options */}
                        {permissions.isCreator && (
                            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Results</h3>
                                <div className="space-y-3">
                                    <LoadingButton
                                        onClick={() => handleExport('csv')}
                                        loading={exporting === 'csv'}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                    >
                                        Export as CSV
                                    </LoadingButton>
                                    
                                    <LoadingButton
                                        onClick={() => handleExport('json')}
                                        loading={exporting === 'json'}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                                    >
                                        Export as JSON
                                    </LoadingButton>
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
