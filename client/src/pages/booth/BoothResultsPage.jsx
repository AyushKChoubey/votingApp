import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { boothService } from "../../services/api";
import { Alert } from "../../components/layout/Alert";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";
import Button from "../../components/layout/Button";
import { useToast } from "../../components/layout/Toast";

const BoothResultsPage = () => {
  const { boothId } = useParams();
  const navigate = useNavigate();

  const [booth, setBooth] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
        if (
          !response.data.permissions.isCreator &&
          !response.data.permissions.hasVoted &&
          !response.data.booth.settings?.resultsVisibleToVoters
        ) {
          setError("You need to vote or be the booth creator to view results");
          return;
        }
      } else {
        setError("Failed to load booth results");
      }
    } catch (err) {
      console.error("Fetch booth results error:", err);
      const status = err?.response?.status || err?.status;
      if (status === 403) {
        setError("You are not authorized to view results for this booth");
      } else if (status === 404) {
        setError("Booth not found");
      } else {
        setError("Failed to load booth results");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrintResults = () => {
    try {
      setError("");

      // Create a new window with only the results content
      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        setError(
          "Popup blocked: unable to open print window. Please allow popups for this site.",
        );
        return;
      }

      const resultsContent = document.querySelector(".results-print-content");

      if (!resultsContent) {
        setError("Unable to find results content for printing");
        return;
      }

      // Build the print document with only the results
      printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${booth?.name || "Booth"} - Result</title>
                    <meta charset="UTF-8">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body { 
                            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                            padding: 20px; 
                            background: white;
                            color: #1f2937;
                            line-height: 1.4;
                            font-size: 11px;
                        }
                        .print-container {
                            max-width: 100%;
                            margin: 0 auto;
                        }
                        .results-header {
                            text-align: center;
                            margin-bottom: 15px;
                            padding-bottom: 10px;
                            border-bottom: 2px solid #e5e7eb;
                        }
                        .results-title { 
                            font-size: 1.5rem; 
                            font-weight: 800; 
                            margin-bottom: 3px;
                            color: #111827;
                            letter-spacing: -0.02em;
                        }
                        .results-subtitle {
                            font-size: 0.85rem;
                            color: #6b7280;
                            margin-bottom: 4px;
                            font-weight: 500;
                        }
                        .meta-info {
                            font-size: 0.7rem;
                            color: #9ca3af;
                            margin-top: 3px;
                        }
                        .summary-stats {
                            display: grid;
                            grid-template-columns: repeat(4, 1fr);
                            gap: 10px;
                            margin-bottom: 15px;
                        }
                        .stat-card {
                            text-align: center;
                            padding: 10px;
                            background: #f9fafb;
                            border: 1px solid #e5e7eb;
                            border-radius: 6px;
                        }
                        .stat-value { 
                            font-size: 1.25rem; 
                            font-weight: 800; 
                            margin-bottom: 2px;
                            color: #111827;
                        }
                        .stat-label { 
                            font-size: 0.7rem; 
                            color: #6b7280;
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 0.03em;
                        }
                        .winner-section {
                            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                            border: 2px solid #f59e0b;
                            border-radius: 8px;
                            padding: 12px;
                            text-align: center;
                            margin-bottom: 15px;
                            box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
                        }
                        .winner-badge {
                            display: inline-block;
                            background: #f59e0b;
                            color: white;
                            padding: 4px 12px;
                            border-radius: 50px;
                            font-size: 0.7rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.03em;
                            margin-bottom: 6px;
                        }
                        .winner-name {
                            font-size: 1.125rem;
                            font-weight: 800;
                            margin-bottom: 4px;
                            color: #92400e;
                        }
                        .winner-stats {
                            font-size: 0.85rem;
                            color: #92400e;
                            font-weight: 600;
                        }
                        .section-title {
                            font-size: 1rem;
                            font-weight: 700;
                            color: #111827;
                            margin-bottom: 10px;
                            padding-bottom: 5px;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .candidate-list {
                            margin-top: 10px;
                        }
                        .candidate-item {
                            background: white;
                            border: 1px solid #e5e7eb;
                            border-radius: 6px;
                            padding: 10px;
                            margin-bottom: 8px;
                            page-break-inside: avoid;
                        }
                        .candidate-item.winner {
                            border-color: #f59e0b;
                            background: #fffbeb;
                        }
                        .candidate-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 6px;
                        }
                        .candidate-left {
                            flex: 1;
                        }
                        .candidate-rank {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            width: 20px;
                            height: 20px;
                            background: #e5e7eb;
                            border-radius: 50%;
                            font-weight: 700;
                            font-size: 0.7rem;
                            margin-right: 8px;
                        }
                        .candidate-item.winner .candidate-rank {
                            background: #f59e0b;
                            color: white;
                        }
                        .candidate-name {
                            font-size: 0.9rem;
                            font-weight: 700;
                            color: #111827;
                            display: inline;
                        }
                        .candidate-item.winner .candidate-name {
                            color: #92400e;
                        }
                        .winner-crown {
                            display: inline-block;
                            margin-left: 4px;
                            font-size: 0.85rem;
                        }
                        .candidate-description {
                            font-size: 0.7rem;
                            color: #6b7280;
                            margin-top: 2px;
                            margin-left: 28px;
                        }
                        .candidate-votes {
                            text-align: right;
                            font-weight: 700;
                        }
                        .vote-count {
                            font-size: 1rem;
                            color: #111827;
                        }
                        .candidate-item.winner .vote-count {
                            color: #92400e;
                        }
                        .vote-percentage {
                            font-size: 0.75rem;
                            color: #6b7280;
                            margin-top: 1px;
                        }
                        .candidate-item.winner .vote-percentage {
                            color: #92400e;
                        }
                        .progress-bar {
                            width: 100%;
                            height: 8px;
                            background-color: #f3f4f6;
                            border-radius: 4px;
                            overflow: hidden;
                            position: relative;
                        }
                        .progress-fill {
                            height: 100%;
                            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
                            border-radius: 4px;
                        }
                        .candidate-item.winner .progress-fill {
                            background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
                        }
                        .no-votes {
                            text-align: center;
                            padding: 20px;
                            color: #9ca3af;
                            font-size: 0.9rem;
                        }
                        .footer {
                            margin-top: 15px;
                            padding-top: 8px;
                            border-top: 1px solid #e5e7eb;
                            text-align: center;
                            color: #9ca3af;
                            font-size: 0.65rem;
                        }
                        @media print {
                            body { 
                                padding: 15px;
                                font-size: 10px;
                            }
                            .summary-stats { 
                                grid-template-columns: repeat(4, 1fr);
                                gap: 8px;
                            }
                            .results-header {
                                margin-bottom: 12px;
                                padding-bottom: 8px;
                            }
                            .results-title {
                                font-size: 1.25rem;
                            }
                            .winner-section {
                                margin-bottom: 12px;
                                padding: 10px;
                            }
                            .candidate-item {
                                page-break-inside: avoid;
                                margin-bottom: 6px;
                                padding: 8px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <div class="results-header">
                            <div class="results-title">${booth?.name || "Voting Booth"}</div>
                            <div class="results-subtitle">Result</div>
                            <div class="meta-info">
                                Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                        </div>
                        
                        <div class="summary-stats">
                            <div class="stat-card">
                                <div class="stat-value">${booth?.totalVotes || 0}</div>
                                <div class="stat-label">Total Votes</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${booth?.members?.length || 0}</div>
                                <div class="stat-label">Members</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${booth?.candidates?.length || 0}</div>
                                <div class="stat-label">Candidates</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${getTurnout()}%</div>
                                <div class="stat-label">Voter Turnout</div>
                            </div>
                        </div>
                        
                        ${
                          winner && booth?.totalVotes > 0
                            ? `
                        <div class="winner-section">
                            <div class="winner-badge">🏆 Winner</div>
                            <div class="winner-name">${winner.name}</div>
                            <div class="winner-stats">${winner.voteCount} votes · ${calculatePercentage(winner.voteCount, booth.totalVotes)}%</div>
                            ${winner.description ? `<div style="margin-top: 12px; color: #92400e; font-size: 0.95rem;">${winner.description}</div>` : ""}
                        </div>
                        `
                            : ""
                        }
                        
                        <div class="section-title">Detailed Results</div>
                        
                        <div class="candidate-list">
                            ${
                              [...(booth?.candidates || [])]
                                .sort((a, b) => b.voteCount - a.voteCount)
                                .map((candidate, index) => {
                                  const percentage = calculatePercentage(
                                    candidate.voteCount,
                                    booth.totalVotes,
                                  );
                                  const isWinner =
                                    candidate._id === winner?._id;
                                  return `
                                <div class="candidate-item${isWinner ? " winner" : ""}">
                                    <div class="candidate-header">
                                        <div class="candidate-left">
                                            <span class="candidate-rank">${index + 1}</span>
                                            <div class="candidate-name">${candidate.name}${isWinner ? '<span class="winner-crown">👑</span>' : ""}</div>
                                            ${candidate.description ? `<div class="candidate-description">${candidate.description}</div>` : ""}
                                        </div>
                                        <div class="candidate-votes">
                                            <div class="vote-count">${candidate.voteCount}</div>
                                            <div class="vote-percentage">${percentage}%</div>
                                        </div>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                                `;
                                })
                                .join("") ||
                              '<div class="no-votes">No votes cast yet</div>'
                            }
                        </div>
                        
                        <div class="footer">
                            This document contains official voting results and should be kept for records.
                        </div>
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
      try {
        addToast("PDF export initiated. Check your printer dialog.", "success");
      } catch (e) {
        /* no-op if toast unavailable */
      }
    } catch (err) {
      console.error("Print error:", err);
      setError("Failed to generate PDF export");
    }
  };

  const calculatePercentage = (voteCount, totalVotes) => {
    return totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  };

  const getWinner = () => {
    if (!booth?.candidates || booth.candidates.length === 0) return null;
    return booth.candidates.reduce((winner, candidate) =>
      candidate.voteCount > (winner?.voteCount || 0) ? candidate : winner,
    );
  };

  const getTurnout = () => {
    if (!booth?.members || booth.members.length === 0) return 0;
    const votersCount = booth.members.filter(
      (member) => member.hasVoted,
    ).length;
    return Math.round((votersCount / booth.members.length) * 100);
  };

  if (loading) {
    return <PageLoading message="Loading results..." />;
  }

  if (error && !booth) {
    // Compute heading based on error type
    let errorHeading = "Failed to load booth results"; // Default fallback

    // Normalize error to a string and check message text for known statuses
    const errorMsg = (error || "").toString();
    const msgLower = errorMsg.toLowerCase();

    if (msgLower.includes("not found") || msgLower.includes("404")) {
      errorHeading = "Booth not found";
    } else if (
      msgLower.includes("not authorized") ||
      msgLower.includes("forbidden") ||
      msgLower.includes("unauthorized") ||
      msgLower.includes("403")
    ) {
      errorHeading = "Access Denied";
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {errorHeading}
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/booth/${boothId}`)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
              >
                Back to Booth
              </button>
              <button
                onClick={() => navigate("/dashboard")}
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
    <div className="min-h-screen theme-bg py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none float">
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent), var(--color-primary))",
          }}
        />
      </div>
      <div
        className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 pointer-events-none float"
        style={{ "--stagger-index": 1 }}
      >
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent), var(--color-secondary))",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-4 animate-fadeIn">
          <div className="text-center pt-2 sm:pt-3 mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold theme-text mb-3 sm:mb-4 break-words">
              <span className="text-gradient">{booth?.name}</span>
            </h1>
            <p
              className="text-sm sm:text-base lg:text-lg theme-muted mb-2 sm:mb-3 max-w-2xl mx-auto leading-relaxed animate-fadeIn break-words"
              style={{ "--stagger-index": 1 }}
            >
              Result
            </p>
          </div>

          {/* Action Buttons (Admin only, centered below title) */}
          {permissions.isCreator && (
            <div
              className="flex flex-row gap-3 justify-center animate-fadeIn mb-4"
              style={{ "--stagger-index": 2 }}
            >
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/booth/${boothId}`)}
                className="flex-1 max-w-[150px]"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                }
                iconPosition="left"
              >
                View Booth
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/booth/${boothId}/admin`)}
                className="flex-1 max-w-[150px]"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110 4m0-4v2m0-6V4"
                    />
                  </svg>
                }
                iconPosition="left"
              >
                Manage
              </Button>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* Quick Stats - Modern Design */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8 animate-fadeIn"
          style={{ "--stagger-index": 3 }}
        >
          <div className="glass-card p-3 sm:p-4 text-center card-hover transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-accent mb-1">
              {booth?.totalVotes || 0}
            </div>
            <div className="text-xs theme-muted font-medium">Total Votes</div>
          </div>
          <div className="glass-card p-3 sm:p-4 text-center card-hover transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary mb-1">
              {booth?.members?.length || 0}
            </div>
            <div className="text-xs theme-muted font-medium">Members</div>
          </div>
          <div className="glass-card p-3 sm:p-4 text-center card-hover transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-secondary mb-1">
              {booth?.candidates?.length || 0}
            </div>
            <div className="text-xs theme-muted font-medium">Candidates</div>
          </div>
          <div className="glass-card p-3 sm:p-4 text-center card-hover transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mb-1">
              {turnout}%
            </div>
            <div className="text-xs theme-muted font-medium">Voter Turnout</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Winner Announcement */}
            {winner && booth?.totalVotes > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-white">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-yellow-200 dark:text-yellow-100"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2L13.09 8.26L20 9L15 13.74L16.18 20.02L10 16.77L3.82 20.02L5 13.74L0 9L6.91 8.26L10 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h2 className="text-3xl font-bold mb-2">Winner!</h2>
                  <h3 className="text-2xl font-semibold mb-2">{winner.name}</h3>
                  <p className="text-lg">
                    {winner.voteCount} votes (
                    {calculatePercentage(winner.voteCount, booth.totalVotes)}%)
                  </p>
                  {winner.description && (
                    <p className="text-yellow-100 dark:text-yellow-50 mt-2 opacity-90">
                      {winner.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Results */}
            <div className="glass-card rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 border border-border results-print-content">
              <h3 className="text-2xl font-bold theme-text mb-4">
                Detailed Results
              </h3>

              {booth?.totalVotes === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 theme-muted mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <h4 className="text-lg font-medium theme-text mb-2">
                    No votes yet
                  </h4>
                  <p className="theme-muted">
                    Be the first to vote in this booth!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...(booth?.candidates || [])]
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((candidate, index) => {
                      const percentage = calculatePercentage(
                        candidate.voteCount,
                        booth.totalVotes,
                      );
                      const isWinner = candidate._id === winner?._id;

                      return (
                        <div
                          key={candidate._id}
                          className={`border-2 rounded-xl p-4 sm:p-6 transition-all ${
                            isWinner
                              ? "border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-900/20"
                              : "border-border glass-card"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                  isWinner
                                    ? "bg-yellow-500 dark:bg-yellow-600"
                                    : index === 0
                                      ? "bg-accent"
                                      : index === 1
                                        ? "bg-blue-500"
                                        : index === 2
                                          ? "bg-purple-500"
                                          : "bg-slate-500"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <h4
                                  className={`text-lg font-semibold ${isWinner ? "text-yellow-800 dark:text-yellow-300" : "theme-text"}`}
                                >
                                  {candidate.name}
                                  {isWinner && (
                                    <svg
                                      className="w-5 h-5 inline ml-2 text-yellow-500 dark:text-yellow-400"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 2L13.09 8.26L20 9L15 13.74L16.18 20.02L10 16.77L3.82 20.02L5 13.74L0 9L6.91 8.26L10 2Z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </h4>
                                {candidate.description && (
                                  <p className="text-sm theme-muted">
                                    {candidate.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-2xl font-bold ${isWinner ? "text-yellow-700 dark:text-yellow-300" : "theme-text"}`}
                              >
                                {candidate.voteCount}
                              </div>
                              <div
                                className={`text-sm ${isWinner ? "text-yellow-600 dark:text-yellow-400" : "theme-muted"}`}
                              >
                                {percentage}%
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-4 rounded-full transition-all duration-1000 ${
                                isWinner
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                  : index === 0
                                    ? "bg-gradient-to-r from-accent to-blue-500"
                                    : index === 1
                                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                      : "bg-gradient-to-r from-slate-400 to-slate-500"
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
              <div className="glass-card rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-border no-print">
                <h3 className="text-lg font-semibold theme-text mb-3">
                  Export Results
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handlePrintResults}
                    className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export as PDF
                  </button>

                  <p className="text-xs theme-muted mt-2">
                    Generates a clean PDF of just the results section without
                    browser chrome or sidebars.
                  </p>
                </div>
              </div>
            )}

            {/* Booth Info */}
            <div className="glass-card rounded-2xl shadow-xl p-6 border border-border">
              <h3 className="text-lg font-semibold theme-text mb-4">
                Booth Information
              </h3>
              <div className="space-y-3 text-base">
                <div className="flex justify-between">
                  <span className="theme-muted">Booth ID:</span>
                  <span className="font-bold theme-text font-mono text-base sm:text-lg">
                    {booth?.boothId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-muted">Creator:</span>
                  <span className="font-medium theme-text">
                    {booth?.creator?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-muted">Created:</span>
                  <span className="font-medium theme-text">
                    {booth?.createdAt
                      ? new Date(booth.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-muted">Status:</span>
                  <span
                    className={`font-medium capitalize ${
                      booth?.status === "active"
                        ? "text-green-600 dark:text-green-400"
                        : "theme-muted"
                    }`}
                  >
                    {booth?.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="theme-muted">Type:</span>
                  <span className="font-medium theme-text capitalize">
                    {booth?.type || booth?.visibility || "Private"}
                  </span>
                </div>
              </div>
            </div>

            {/* Voting Statistics */}
            <div className="glass-card rounded-2xl shadow-xl p-6 border border-border">
              <h3 className="text-lg font-semibold theme-text mb-4">
                Voting Statistics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="theme-muted">Voter Turnout</span>
                    <span className="font-medium theme-text">{turnout}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-accent to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${turnout}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-2 bg-accent/10 dark:bg-accent/20 rounded">
                    <div className="font-semibold theme-text">
                      {booth?.members?.filter((m) => m.hasVoted).length || 0}
                    </div>
                    <div className="theme-muted">Voted</div>
                  </div>
                  <div className="text-center p-2 bg-accent/10 dark:bg-accent/20 rounded">
                    <div className="font-semibold theme-text">
                      {(booth?.members?.length || 0) -
                        (booth?.members?.filter((m) => m.hasVoted).length || 0)}
                    </div>
                    <div className="theme-muted">Not Voted</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoothResultsPage;
