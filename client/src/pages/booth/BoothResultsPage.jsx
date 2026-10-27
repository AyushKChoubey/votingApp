import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import  { boothService } from "../../services/api";
import { Alert } from "../../components/layout/Alert";
import { PageLoading } from "../../components/layout/Loading";
import Button from "../../components/layout/Button";
import BackButton from "../../components/layout/BackButton";
import { useToast } from "../../components/layout/Toast";
import AppWatermark from "../../components/layout/AuthWatermarkBackground";
import PullToRefresh from "../../components/layout/PullToRefresh";
import { useRegisterModal } from "../../hooks/useRegisterModal";

const BoothResultsPage = () => {
  const { boothId } = useParams();
  const navigate = useNavigate();

  const [booth, setBooth] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBoothInfo, setShowBoothInfo] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  useRegisterModal(showExportModal, () => setShowExportModal(false));
  useRegisterModal(showMenuDropdown, () => setShowMenuDropdown(false));
  useRegisterModal(showBoothInfo, () => setShowBoothInfo(false));
  const [countdownText, setCountdownText] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [expandDescription, setExpandDescription] = useState(false);
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

        // Only admin/creator can access the dedicated results page; regular voters only see the detail page results section
        if (!response.data.permissions.isCreator) {
          navigate(`/booth/${boothId}`, { replace: true });
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

  
  // Countdown timer for scheduled booths
  useEffect(() => {
    let timer = null;
    const computeCountdown = () => {
      const settingsObj = booth?.settings || {};
      const start = settingsObj.votingStartTime ? new Date(settingsObj.votingStartTime) : null;
      const end = settingsObj.votingEndTime ? new Date(settingsObj.votingEndTime) : null;
      const now = new Date();

      if (!start && !end) {
        setCountdownText(null);
        return;
      }

      if (start && now < start) {
        const ms = start - now;
        setCountdownText(`Starts in ${formatDuration(ms)}`);
        return;
      }

      if (end && (!start || now >= start) && now < end) {
        const ms = end - now;
        setCountdownText(`Time remaining ${formatDuration(ms)}`);
        return;
      }

      if (end && now >= end) {
        setCountdownText("Voting ended");
        return;
      }

      setCountdownText(null);
    };

    computeCountdown();
    timer = setInterval(computeCountdown, 1000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [booth?.settings]);

  function pad(n) {
    return n.toString().padStart(2, "0");
  }
  function formatDuration(ms) {
    if (ms <= 0) return "00:00:00";
    const total = Math.floor(ms / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  const escapeHtml = (unsafe) => {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\x27/g, "&#039;");
  };

  const handlePrintResults = () => {
    if (!permissions.isCreator) {
      addToast("Only booth organizers can export results", "error");
      return;
    }
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
                    <title>${escapeHtml(booth?.name || "Booth")} - Result</title>
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
                          <div class="results-title">${escapeHtml(booth?.name || "Voting Booth")}</div>
                          <div class="results-subtitle">Result</div>
                          <div class="meta-info">
                            ID: ${escapeHtml(booth?.boothId || booth?.id || "")} · Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
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
                            <div class="winner-name">${escapeHtml(winner.name)}</div>
                            <div class="winner-stats">${winner.voteCount} votes · ${calculatePercentage(winner.voteCount, booth.totalVotes)}%</div>
                            ${winner.description ? `<div style="margin-top: 12px; color: #92400e; font-size: 0.95rem;">${escapeHtml(winner.description)}</div>` : ""}
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
                                  const isWinner = candidate.id === winner?.id;
                                  return `
                                <div class="candidate-item${isWinner ? " winner" : ""}">
                                    <div class="candidate-header">
                                        <div class="candidate-left">
                                            <span class="candidate-rank">${index + 1}</span>
                                            <div class="candidate-name">${escapeHtml(candidate.name)}${isWinner ? '<span class="winner-crown">👑</span>' : ""}</div>
                                            ${candidate.description ? `<div class="candidate-description">${escapeHtml(candidate.description)}</div>` : ""}
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
      <div className="min-h-screen theme-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="theme-surface rounded-2xl shadow-2xl p-8 border border-border">
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
            <h2 className="text-2xl font-bold theme-text mb-4">
              {errorHeading}
            </h2>
            <p className="theme-muted mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/booth/${boothId}`)}
                className="w-full btn-theme py-3 px-6 rounded-xl font-semibold transition-all duration-300"
              >
                Back to Booth
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full theme-surface hover:bg-accent-50 theme-text py-3 px-6 rounded-xl font-semibold transition-all duration-300 border border-border"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  const renderMobileResults = () => {
    const totalMembers = booth?.members?.length || booth?.memberCount || 0;
    let voted = 0;
    if (booth?.members && booth.members.length > 0) {
      voted = booth.members.filter((m) => m.hasVoted).length;
    } else {
      voted = booth?.totalVotes || 0;
    }
    const notVoted = Math.max(0, totalMembers - voted);
    const turnout = totalMembers > 0 ? Math.min(100, Math.round((voted / totalMembers) * 100)) : 0;

    const sortedCandidates = [...(booth?.candidates || [])].sort(
      (a, b) => (b.voteCount || 0) - (a.voteCount || 0)
    );
    const maxVote = sortedCandidates[0]?.voteCount || 0;

    const candidateColors = [
      { bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", bar: "bg-cyan-600" },
      { bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", bar: "bg-purple-600" },
      { bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", bar: "bg-emerald-600" },
      { bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", bar: "bg-amber-600" },
      { bg: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", bar: "bg-rose-600" },
    ];

    const copyBoothId = () => {
      const code = booth?.boothId || booth?.id || "";
      if (code) {
        navigator.clipboard.writeText(code);
        setCopiedId(true);
        addToast("Booth ID copied", "success");
        setTimeout(() => setCopiedId(false), 2000);
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      try {
        return new Date(dateStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return "N/A";
      }
    };

    const desc = booth?.description || "";
    const isLongDesc = desc.length > 70;

    return (
      <div className="w-full max-w-full overflow-x-hidden px-4 pt-3 pb-28 sm:pb-12 animate-fadeIn">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BackButton fallback="/dashboard" />
            <h1 className="text-xl font-bold theme-text">Booth Results</h1>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenuDropdown((prev) => !prev)}
              className="w-10 h-10 rounded-xl border border-border theme-surface theme-text flex items-center justify-center shadow-sm hover:bg-accent-50 active:scale-95 transition-all"
              aria-label="Options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenuDropdown && (
              <div className="absolute right-0 mt-2 w-48 theme-surface rounded-2xl shadow-xl border border-border py-1.5 z-50 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => { setShowMenuDropdown(false); navigate(`/booth/${boothId}`); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold theme-text hover:bg-accent-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  View Booth
                </button>
                {permissions.isCreator && (
                  <button
                    type="button"
                    onClick={() => { setShowMenuDropdown(false); navigate(`/booth/${boothId}/admin`); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold theme-text hover:bg-accent-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110 4m0-4v2m0-6V4" /></svg>
                    Manage Booth
                  </button>
                )}
                <div className="h-px bg-border my-1" />
                {permissions.isCreator && (
                  <button
                    type="button"
                    onClick={() => { setShowMenuDropdown(false); setShowExportModal(true); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-error hover:bg-error/10 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Export as PDF
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Booth Header Card: identical box around name, status, creator, countdown and desc */}
        <div className="theme-surface rounded-2xl border border-border p-4 mb-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-50 text-accent border border-accent/20 flex items-center justify-center shrink-0 shadow-xs">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="text-base font-bold theme-text truncate">{booth?.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase shrink-0 ${
                    booth?.status === "active"
                      ? "bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-500/50"
                      : "bg-transparent text-red-600 dark:text-red-400 border border-red-500/50"
                  }`}
                >
                  {booth?.status === "active" ? "Active" : "Closed"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {permissions.isCreator && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-transparent text-cyan-600 dark:text-cyan-400 border border-cyan-500/50">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Creator
                  </span>
                )}
                {countdownText && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-transparent text-red-600 dark:text-red-400 border border-red-500/60 dark:border-red-500/50">
                    <svg className="w-3 h-3 animate-pulse text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {countdownText}
                  </span>
                )}
              </div>
              {desc && (
                <div className="text-xs theme-muted leading-relaxed">
                  <span>{isLongDesc && !expandDescription ? `${desc.slice(0, 70)}...` : desc}</span>
                  {isLongDesc && (
                    <button
                      type="button"
                      onClick={() => setExpandDescription((prev) => !prev)}
                      className="text-accent font-semibold ml-1.5 hover:underline"
                    >
                      {expandDescription ? "less" : "more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4 Key Stats Grid (2x2) */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="theme-surface rounded-2xl p-3.5 border border-border shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent border border-accent/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold theme-text leading-tight">{booth?.totalVotes || 0}</div>
              <div className="text-[11px] theme-muted font-medium truncate">Total Votes</div>
            </div>
          </div>

          <div className="theme-surface rounded-2xl p-3.5 border border-border shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent border border-accent/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold theme-text leading-tight">{totalMembers}</div>
              <div className="text-[11px] theme-muted font-medium truncate">Members</div>
            </div>
          </div>

          <div className="theme-surface rounded-2xl p-3.5 border border-border shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent border border-accent/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold theme-text leading-tight">{booth?.candidates?.length || 0}</div>
              <div className="text-[11px] theme-muted font-medium truncate">Candidates</div>
            </div>
          </div>

          <div className="theme-surface rounded-2xl p-3.5 border border-border shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent border border-accent/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold theme-text leading-tight">{turnout}%</div>
              <div className="text-[11px] theme-muted font-medium truncate">Voter Turnout</div>
            </div>
          </div>
        </div>

        {/* Detailed Results Section */}
        <div className="mb-5">
          <div className="text-sm font-bold theme-text mb-3">Detailed Results</div>
          
          {(booth?.totalVotes || 0) === 0 ? (
            /* Screen 1: Empty State */
            <div className="theme-surface rounded-2xl p-8 border border-border shadow-xs text-center">
              <div className="w-14 h-14 rounded-full bg-accent-50 text-accent border border-accent/20 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold theme-text mb-1">No votes yet</h3>
              <p className="text-xs theme-muted max-w-xs mx-auto">
                Results will appear here once voting starts.
              </p>
            </div>
          ) : (
            /* Screen 2: Results with Data */
            <div className="space-y-2.5">
              {sortedCandidates.map((candidate, idx) => {
                const total = booth?.totalVotes || 0;
                const count = candidate.voteCount || 0;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const isLeading = idx === 0 && count > 0;
                const color = candidateColors[idx % candidateColors.length];

                return (
                  <div key={candidate._id || candidate.id || idx} className="theme-surface rounded-2xl p-3.5 border border-border shadow-xs">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-xs theme-muted w-3 text-center">{idx + 1}</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold theme-text truncate">{candidate.name}</span>
                          {isLeading && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/40 shrink-0">
                              👑 Leading
                            </span>
                          )}
                        </div>
                        {candidate.description && (
                          <div className="text-xs theme-muted truncate">{candidate.description}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold theme-text">{percentage}%</div>
                        <div className="text-[11px] theme-muted">{count} vote{count !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${color.bar}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Screen 3: Booth Information (Collapsible Accordion) */}
        <div className="theme-surface rounded-2xl border border-border p-4 mb-5 shadow-xs">
          <button
            type="button"
            onClick={() => setShowBoothInfo((prev) => !prev)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <span className="text-sm font-bold theme-text">Booth Information</span>
            <svg
              className={`w-4 h-4 theme-muted transform transition-transform duration-200 ${
                showBoothInfo ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showBoothInfo && (
            <div className="mt-3 pt-3 border-t border-border space-y-2.5 text-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="theme-muted flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                  Booth ID
                </span>
                <div className="flex items-center gap-1 font-mono font-bold theme-text">
                  <span>{booth?.boothId || booth?.id}</span>
                  <button
                    type="button"
                    onClick={copyBoothId}
                    className="p-1 hover:text-accent transition-colors"
                    title="Copy Booth ID"
                  >
                    {copiedId ? (
                      <span className="text-[10px] text-success font-semibold">Copied!</span>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="theme-muted flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Creator
                </span>
                <span className="font-semibold theme-text">{booth?.creator?.name || "Creator"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="theme-muted flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Created
                </span>
                <span className="theme-text">{formatDate(booth?.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="theme-muted flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Status
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] bg-transparent border ${
                  booth?.status === "active"
                    ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/50"
                    : "text-rose-600 dark:text-rose-400 border-rose-500/50"
                }`}>
                  {booth?.status === "active" ? "Active" : "Closed"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="theme-muted flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Type
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 font-semibold text-[10px] theme-text">
                  {booth?.settings?.restrictDomain ? "Restricted" : "Private"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Voting Statistics */}
        <div className="theme-surface rounded-2xl border border-border p-4 mb-6 shadow-xs">
          <div className="text-sm font-bold theme-text mb-2">Voting Statistics</div>
          <div className="mb-3">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="theme-muted">Voter Turnout</span>
              <span className="theme-text font-bold">{turnout}%</span>
            </div>
            <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-cyan-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${turnout}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl border border-border bg-black/5 dark:bg-white/5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <div className="text-base font-bold theme-text">{voted}</div>
                <div className="text-[10px] theme-muted font-medium">Voted</div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-black/5 dark:bg-white/5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black/10 dark:bg-white/10 theme-muted flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <div className="text-base font-bold theme-text">{notVoted}</div>
                <div className="text-[10px] theme-muted font-medium">Not Voted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action: Export as PDF */}
        {permissions.isCreator && (
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="w-full py-3.5 rounded-2xl bg-error hover:bg-error/90 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export as PDF
          </button>
        )}
      </div>
    );
  };

  const winner = getWinner();
  const turnout = getTurnout();

  return (
    <div className="min-h-screen theme-bg relative overflow-hidden">
      <AppWatermark variant="shield" />
      {/* ── MOBILE RESULTS VIEW (md:hidden) ── */}
      <div className="md:hidden relative z-10">
        <PullToRefresh onRefresh={fetchBoothDetails}>
          {renderMobileResults()}
        </PullToRefresh>
      </div>

      {/* ── DESKTOP RESULTS VIEW (hidden md:block) ── */}
      <div className="hidden md:block py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 relative overflow-hidden z-10">
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none float">
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-15"
        />
      </div>
      <div
        className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 pointer-events-none float"
        style={{ "--stagger-index": 1 }}
      >
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-15"
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-4 animate-fadeIn">
          <div className="text-center pt-2 sm:pt-3 mb-4">
            <h1 className="hidden sm:block text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 break-words">
              <span className="text-gradient">Booth Results</span>
            </h1>
            <p className="text-sm sm:text-base theme-muted font-mono font-semibold mb-1">
              Booth ID: {booth?.boothId || booth?.id}
            </p>
            <p className="text-base sm:text-lg font-semibold theme-text mb-1 break-words">
              {booth?.name}
            </p>
            {booth?.description && (
              <p className="text-sm sm:text-base theme-muted max-w-2xl mx-auto leading-relaxed break-words">
                {booth?.description}
              </p>
            )}
          </div>

          {/* Status Badges (centered below description) */}
          <div
            className="flex flex-wrap justify-center gap-2 animate-fadeIn mb-4"
            style={{ "--stagger-index": 1 }}
          >
            <span
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${
                booth?.status === "active"
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-theme-surface theme-muted border border-border"
              }`}
            >
              {booth?.status?.toUpperCase()}
            </span>

            {permissions.isCreator && (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-accent/10 text-accent border border-accent/20">
                CREATOR
              </span>
            )}

            {permissions.hasVoted && (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-secondary/10 text-secondary border border-secondary/20">
                VOTED
              </span>
            )}

            <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-warning/10 text-warning border border-warning/20">
              TURNOUT {turnout}%
            </span>
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
                      const isWinner = candidate.id === winner?.id;

                      return (
                        <div
                          key={candidate.id}
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

      {/* Screen 4: Export Bottom Sheet */}
      <MobileExportResultsBottomSheet
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={() => {
          setShowExportModal(false);
          handlePrintResults();
        }}
        loading={exporting}
      />
    </div>
  );
};


const MobileExportResultsBottomSheet = ({ isOpen, onClose, onExport, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-lg theme-surface rounded-t-3xl p-6 pb-28 sm:pb-8 shadow-2xl border-t border-border animate-slideUp text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="w-6" />
          <h3 className="text-base font-bold theme-text">Export Results</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-muted hover:theme-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* PDF Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-error/15 text-error flex items-center justify-center mx-auto my-4 shadow-sm">
          <div className="text-center font-bold">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
        </div>

        <h4 className="text-lg font-bold theme-text mb-1">Export Results</h4>
        <p className="text-xs sm:text-sm theme-muted leading-relaxed max-w-xs mx-auto mb-6">
          Generates a clean PDF of just the results section.
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onExport}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-error hover:bg-error/90 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export as PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl theme-surface border border-border theme-text font-semibold text-sm hover:bg-accent-50 active:scale-95 transition-transform"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


export default BoothResultsPage;
