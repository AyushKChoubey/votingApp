import { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import api, { boothService } from "../../services/api";
import { Alert } from "../../components/layout/Alert";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";
import { useToast } from "../../components/layout/Toast";
import Button from "../../components/layout/Button";
import BackButton from "../../components/layout/BackButton";
const QRCodeModal = lazy(() =>
  import("../../components/booth/QRCodeModal").then((m) => ({
    default: m.QRCodeModal,
  })),
);

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
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const lastStatusRef = useRef(null);
  const { addToast } = useToast();
  const [qrModalData, setQrModalData] = useState(null);
  const [countdownText, setCountdownText] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBoothInfo, setShowBoothInfo] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandDescription, setExpandDescription] = useState(false);
  const [voteSuccessModal, setVoteSuccessModal] = useState({ open: false, candidateName: "" });
  const [votedCandidateName, setVotedCandidateName] = useState(() => {
    try {
      return localStorage.getItem(`booth_${boothId}_voted_candidate`) || "";
    } catch (e) {
      return "";
    }
  });

  const location = useLocation();
  const initialBooth =
    location && location.state && location.state.booth
      ? location.state.booth
      : null;

  useEffect(() => {
    // Load booth details first, then show any toasts that depend on membership
    (async () => {
      const ok = await fetchBoothDetails();
      const joined = searchParams.get("joined");
      if (joined === "true" && ok) {
        addToast(
          "Welcome to the booth! You have successfully joined.",
          "success",
        );
      }
    })();
  }, [boothId, searchParams]);

  // Live results socket connection
  useEffect(() => {
    // Only connect when live results are enabled for this booth
    if (!booth?.settings?.showLiveResults) return;

    let mounted = true;
    const SOCKET_URL =
      import.meta.env.VITE_API_URL || (import.meta.env.DEV ? undefined : "http://localhost:5000");

    (async () => {
      try {
        const mod = await import("socket.io-client");
        const ioClient = mod.io || mod.default || mod;

        if (!mounted) return;

        const socket = ioClient(SOCKET_URL, {
          transports: ["websocket", "polling"],
          auth: { token: localStorage.getItem("token") },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          // join booth room
          socket.emit("joinBooth", boothId);
        });

        socket.on("vote:update", (payload) => {
          // Update only aggregates to avoid overwriting client-only state
          if (!payload) return;
          setBooth((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              candidates: payload.candidates,
              totalVotes: payload.totalVotes,
            };
          });
          // Optionally refresh stats
          setStats((prev) => ({ ...prev }));
        });

        socket.on("disconnect", () => {
          // handle disconnect silently
        });
      } catch (err) {
        console.error("Failed to initialize live socket (dynamic import)", err);
      }
    })();

    return () => {
      mounted = false;
      try {
        const s = socketRef.current;
        if (s) {
          s.emit("leaveBooth", boothId);
          s.disconnect();
        }
        socketRef.current = null;
      } catch (e) {
        // no-op
      }
    };
  }, [booth?.settings?.showLiveResults, boothId]);

  // Countdown timer for scheduled booths (shows to members)
  useEffect(() => {
    let timer = null;

    const compute = () => {
      const settings = (booth && booth.settings) || {};
      const start = settings.votingStartTime
        ? new Date(settings.votingStartTime)
        : null;
      const end = settings.votingEndTime
        ? new Date(settings.votingEndTime)
        : null;
      const now = new Date();

      let currentStatus = null;

      // No schedule
      if (!start && !end) {
        setCountdownText(null);
        return;
      }

      // Before start
      if (start && now < start) {
        const ms = start - now;
        setCountdownText(`Starts in ${formatDuration(ms)}`);
        currentStatus = "waiting";
        lastStatusRef.current = currentStatus;
        return;
      }

      // During voting
      if (end && (!start || now >= start) && now < end) {
        const ms = end - now;
        setCountdownText(`Time remaining ${formatDuration(ms)}`);
        currentStatus = "active";

        // Transition from waiting to active - refetch to update booth status
        if (lastStatusRef.current === "waiting") {
          fetchBoothDetails(true);
        }
        lastStatusRef.current = currentStatus;
        return;
      }

      // After end
      if (end && now >= end) {
        setCountdownText(`Voting ended`);
        currentStatus = "ended";

        // Transition to ended - refetch to update booth status
        if (lastStatusRef.current === "active") {
          fetchBoothDetails(true);
        }
        lastStatusRef.current = currentStatus;
        return;
      }

      setCountdownText(null);
    };

    // only show countdown for members (or creator)
    if (permissions && (permissions.isMember || permissions.isCreator)) {
      compute();
      timer = setInterval(compute, 1000);
    } else {
      setCountdownText(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [booth?.settings, permissions]);

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
    if (days > 0)
      return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  const fetchBoothDetails = async (silentRefresh = false) => {
    try {
      if (!silentRefresh) setLoading(true);
      const response = await boothService.getBooth(boothId);

      if (response.success && response.data) {
        setBooth(response.data.booth);
        setPermissions(response.data.permissions);
        setVotingStatus(response.data.votingStatus);
        setStats(response.data.stats);
        return true;
      } else {
        setError("Failed to load booth details");
        return false;
      }
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 403) {
        setError(
          "You are not a member of this booth. Please join using an invite code.",
        );
      } else if (status === 404) {
        setError("Booth not found");
      } else {
        setError("Failed to load booth details");
      }
    } finally {
      if (!silentRefresh) setLoading(false);
    }
  };

  const handleVote = async (candidateIndex) => {
    if (!permissions.canVote) return;

    try {
      setVoting(true);
      const response = await boothService.vote(boothId, candidateIndex);

      if (response.success) {
        const votedName =
          booth?.candidates?.[candidateIndex]?.name ||
          response.candidate ||
          "Candidate";
        try {
          localStorage.setItem(`booth_${boothId}_voted_candidate`, votedName);
        } catch (e) {
          // Ignore localStorage errors
        }
        setVotedCandidateName(votedName);
        setVoteSuccessModal({ open: true, candidateName: votedName });
        await fetchBoothDetails();
        addToast("Your vote has been recorded successfully!", "success");
        setSelectedCandidate(null);
      } else {
        setError(response.error || "Failed to record vote");
      }
    } catch (err) {
      // Vote error
      setError(err.message || "Failed to record vote");
    } finally {
      setVoting(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (booth?.inviteCode) {
      navigator.clipboard.writeText(booth.inviteCode);
      addToast("Invite code copied to clipboard!", "success");
    }
  };

  const handleCopyDirectInviteLink = () => {
    if (booth?.inviteCode) {
      const link = `${window.location.origin}/booth/join/${booth.inviteCode}`;
      navigator.clipboard.writeText(link);
      addToast("Invite link copied to clipboard!", "success");
    }
  };

  const showQRCode = () => {
    if (booth) {
      const inviteLink = `${window.location.origin}/booth/join/${booth.inviteCode}`;
      setQrModalData({
        inviteLink,
        inviteCode: booth.inviteCode,
        boothName: booth.name,
      });
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-code-canvas");
    if (canvas && qrModalData) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${qrModalData.boothName.replace(/\s+/g, "-")}-QR.png`;
      link.href = url;
      link.click();
      addToast("QR code downloaded", "success");
    }
  };

  const handleCopyDetailsPlain = () => {
    if (!booth) return;
    


  const source = initialBooth || booth;
    const max = Number(source?.maxMembers);
    const maxDisplay = !Number.isNaN(max) && max > 0 ? max : 50;
    const membersCount =
      source?.memberCount ?? (source?.members ? source.members.length : 0);
    const link = `${window.location.origin}/booth/join/${booth.inviteCode}`;

    const details = `Booth: ${booth.name}\nDescription: ${booth.description || "No description"}\nInvite Code: ${booth.inviteCode}\nJoin Link: ${link}\nMembers: ${membersCount} / ${maxDisplay}`;

    try {
      navigator.clipboard.writeText(details);
      addToast("Booth details copied as plain text", "success");
    } catch (err) {
      // Copy details failed
      addToast("Failed to copy details", "error");
    }
  };

  const handleShareBooth = async () => {
    if (!booth?.inviteCode) return;

    const shareData = {
      title: `Vote in: ${booth.name}`,
      text: `Join the voting booth "${booth.name}" - click to join instantly!`,
      url: `${window.location.origin}/booth/join/${booth.inviteCode}`,
    };

    // Check if native share is available (mobile devices)
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
        addToast("Shared successfully!", "success");
      } catch (err) {
        if (err.name !== "AbortError") {
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
      if (votingStatus.reason === "not_started") {
        return "Voting has not started yet";
      } else if (votingStatus.reason === "ended") {
        return "Voting has ended";
      } else if (votingStatus.reason === "closed") {
        return "Booth is closed";
      }
    }
    return null;
  };

  if (loading) {
    return <PageLoading message="Loading booth details..." />;
  }

  if (error && !booth) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="glass-card p-8">
            <svg
              className="w-16 h-16 text-error mx-auto mb-4"
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
              Access Denied
            </h2>
            <p className="theme-muted mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/booth/join")}
                variant="primary"
                size="lg"
                fullWidth
              >
                Join a Booth
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                size="lg"
                fullWidth
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderMobileDetails = () => {
    const totalMembers = booth?.members?.length || booth?.memberCount || 0;
    let voted = 0;
    if (booth?.members && booth.members.length > 0) {
      voted = booth.members.filter((m) => m.hasVoted).length;
    } else {
      voted = booth?.totalVotes || 0;
    }
    const turnout = totalMembers > 0 ? Math.min(100, Math.round((voted / totalMembers) * 100)) : 0;
    const canViewResults = Boolean(booth?.settings?.resultsVisibleToVoters || permissions.isCreator);

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
        setCopiedCode(true);
        addToast("Booth ID copied", "success");
        setTimeout(() => setCopiedCode(false), 2000);
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
        {/* Top Header: Single clean header matching mockup */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BackButton fallback="/dashboard" />
            <h1 className="text-xl font-bold theme-text">Booth Details</h1>
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
                {canViewResults && (
                  <button
                    type="button"
                    onClick={() => { setShowMenuDropdown(false); navigate(`/booth/${boothId}/results`); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold theme-text hover:bg-accent-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    View Detailed Results
                  </button>
                )}
                {permissions.isCreator && (
                  <button
                    type="button"
                    onClick={() => { setShowMenuDropdown(false); navigate(`/booth/${boothId}/admin`); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold theme-text hover:bg-accent-50 flex items-center gap-2 border-t border-border mt-0.5 pt-2"
                  >
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110 4m0-4v2m0-6V4" /></svg>
                    Manage Booth
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Booth Header Card */}
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
                      ? "bg-success/15 text-success border border-success/30"
                      : "bg-error/15 text-error border border-error/30"
                  }`}
                >
                  {booth?.status === "active" ? "Active" : "Closed"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {permissions.isCreator && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold btn-theme text-on-primary shadow-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Creator
                  </span>
                )}
                {permissions.hasVoted && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-success/15 text-success border border-success/30">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Voted
                  </span>
                )}
                {countdownText && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800">
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
              <div className="text-[11px] theme-muted font-medium truncate">Participation</div>
            </div>
          </div>
        </div>

        {/* Voting Action Section (if canVote & not voted) */}
        {permissions.canVote && !permissions.hasVoted && (
          <div className="theme-surface rounded-2xl border border-border p-4 mb-5 shadow-xs">
            <div className="text-sm font-bold theme-text mb-2">Cast Your Vote</div>
            <p className="text-xs theme-muted mb-3">Select a candidate below and confirm your choice.</p>
            <div className="space-y-2 mb-4">
              {booth?.candidates?.map((candidate, idx) => {
                const isSelected = selectedCandidate === idx;
                const color = candidateColors[idx % candidateColors.length];
                return (
                  <div
                    key={candidate._id || candidate.id || idx}
                    onClick={() => setSelectedCandidate(idx)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-accent bg-accent-50/50 shadow-sm"
                        : "border-border hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold theme-text truncate">{candidate.name}</div>
                        {candidate.description && (
                          <div className="text-[11px] theme-muted truncate">{candidate.description}</div>
                        )}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "border-accent bg-accent" : "border-border"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedCandidate !== null) handleVote(selectedCandidate);
              }}
              disabled={selectedCandidate === null || voting}
              className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-semibold text-xs shadow-md disabled:opacity-50 active:scale-95 transition-transform"
            >
              {voting ? "Saving vote..." : "Confirm & Cast Vote"}
            </button>
          </div>
        )}

        {/* If user has voted, show Vote Recorded confirmation banner */}
        {permissions.hasVoted && (
          <div className="theme-surface rounded-2xl border border-success/30 bg-success/5 p-4 mb-5 shadow-xs flex items-center gap-3 animate-fadeIn">
            <div className="w-10 h-10 rounded-full bg-success/15 text-success border border-success/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold theme-text">Vote Recorded</div>
              <div className="text-[11px] theme-muted">Your vote has been saved and counted.</div>
            </div>
          </div>
        )}

        {/* Current Results view (ONLY rendered if results are visible to user; redundant candidate list removed) */}
        {canViewResults && (
          <div className="theme-surface rounded-2xl border border-border p-4 mb-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold theme-text">Current Results</h3>
              {booth?.settings?.showLiveResults && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-success/15 text-success border border-success/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Live
                </span>
              )}
            </div>

            <div className="space-y-3">
              {booth?.candidates?.map((candidate, idx) => {
                const total = booth?.totalVotes || 0;
                const count = candidate.voteCount ?? 0;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const color = candidateColors[idx % candidateColors.length];

                return (
                  <div key={candidate._id || candidate.id || idx}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color.bg}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold theme-text truncate">{candidate.name}</div>
                        {candidate.description && (
                          <div className="text-[11px] theme-muted truncate">{candidate.description}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold theme-text">{percentage}%</div>
                        <div className="text-[10px] theme-muted">{count} vote{count !== 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${color.bar}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Booth Information (Collapsible Accordion) */}
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
                    {copiedCode ? (
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
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  booth?.status === "active" ? "bg-success/15 text-success" : "bg-error/15 text-error"
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

        {/* Primary Action Button: View Detailed Results (ONLY when canViewResults is true) */}
        {canViewResults && (
          <button
            type="button"
            onClick={() => navigate(`/booth/${boothId}/results`)}
            className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            View Detailed Results
          </button>
        )}
      </div>
    );
  };

    // Derived values for display (prefer navigation state for immediate post-create render)
  const source = initialBooth || booth;
  const membersCount = source
    ? Array.isArray(source.members)
      ? source.members.length
      : source.memberCount || 0
    : 0;
  const maxMembersDisplay = (() => {
    const max = Number(source?.maxMembers);
    // Fallback to 50 if value is missing or invalid
    return !Number.isNaN(max) && max > 0 ? max : 50;
  })();

  return (
    <div className="min-h-screen theme-bg">
      {/* ── MOBILE DETAILS VIEW (md:hidden) ── */}
      <div className="md:hidden">
        {renderMobileDetails()}
      </div>

      {/* ── DESKTOP DETAILS VIEW (hidden md:block) ── */}
      <div className="hidden md:block py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 animate-fadeIn">
          <div className="text-center pt-2 sm:pt-3 mb-4">
            <h1 className="hidden sm:block text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 break-words">
              <span className="text-gradient">Booth Details</span>
            </h1>
            <p className="text-sm sm:text-base theme-muted font-mono font-semibold mb-1">
              Booth ID: {booth?.boothId}
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
            style={{ "--stagger-index": 2 }}
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
            {/* Countdown visible to members */}
            {countdownText &&
              (permissions.isMember || permissions.isCreator) && (
                <span
                  style={{
                    background: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                  }}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold"
                >
                  {countdownText}
                </span>
              )}
          </div>

          {/* Action Buttons (Admin only, centered below badges) */}
          {permissions.isCreator && (
            <div
              className="flex flex-row gap-3 justify-center animate-fadeIn"
              style={{ "--stagger-index": 3 }}
            >
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

              <Button
                variant="primary"
                size="md"
                onClick={() => navigate(`/booth/${boothId}/results`)}
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
                iconPosition="left"
              >
                Results
              </Button>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 sm:mb-6">
            <Alert type="error" message={error} />
          </div>
        )}

        {/* Quick Stats - Modern Design */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8 animate-fadeIn"
          style={{ "--stagger-index": 3 }}
        >
          <div className="glass-card p-3 sm:p-4 text-center card-hover transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
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
              {membersCount}
            </div>
            <div className="text-xs theme-muted font-medium">Members</div>
          </div>
          <div className="glass-card p-3 sm:p-4 text-center card-hover transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
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
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary"
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
              {stats?.votingPercentage
                ? `${Math.round(stats.votingPercentage)}%`
                : "0%"}
            </div>
            <div className="text-xs theme-muted font-medium">Participation</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Voting Status */}
            {getVotingStatusMessage() && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-amber-600 dark:text-amber-400"
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
                  </div>
                  <span className="text-amber-800 dark:text-amber-300 font-medium text-sm sm:text-base">
                    {getVotingStatusMessage()}
                  </span>
                </div>
              </div>
            )}

            {/* Voting Interface */}
            {permissions.canVote && (
              <div
                className="glass-card p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all duration-300 animate-fadeIn"
                style={{ "--stagger-index": 4 }}
              >
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 text-primary"
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
                  <h2 className="text-xl sm:text-2xl font-bold theme-text">
                    Cast Your Vote
                  </h2>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {booth?.candidates?.map((candidate, index) => (
                    <div
                      key={candidate._id || candidate.id || index}
                      className={`border-2 rounded-lg sm:rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                        selectedCandidate === index
                          ? "border-accent bg-accent/5 shadow-lg ring-2 ring-accent/20"
                          : "border-border hover:border-accent hover:bg-accent/5 hover:shadow-md"
                      }`}
                      onClick={() => setSelectedCandidate(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                                selectedCandidate === index
                                  ? "bg-accent/20"
                                  : "bg-theme-surface"
                              }`}
                            >
                              <span
                                className={`text-sm font-bold ${
                                  selectedCandidate === index
                                    ? "text-accent"
                                    : "theme-muted"
                                }`}
                              >
                                {index + 1}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold theme-text">
                              {candidate.name}
                            </h3>
                          </div>
                          {candidate.description && (
                            <p className="text-sm sm:text-base theme-muted ml-9 leading-relaxed">
                              {candidate.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center ml-4">
                          <input
                            type="radio"
                            name="candidate"
                            value={index}
                            checked={selectedCandidate === index}
                            onChange={() => setSelectedCandidate(index)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-accent focus:ring-accent focus:ring-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleVote(selectedCandidate)}
                  disabled={selectedCandidate === null || voting}
                  loading={voting}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="mt-4 sm:mt-6"
                >
                  Submit Vote
                </Button>
              </div>
            )}

            {/* Results Preview */}
            {(permissions.hasVoted || !permissions.canVote) &&
              booth?.settings?.resultsVisibleToVoters && (
                <div
                  className="glass-card p-4 sm:p-6 lg:p-8 hover:shadow-xl transition-all duration-300 animate-fadeIn"
                  style={{ "--stagger-index": 4 }}
                >
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-success"
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
                    <h2 className="text-xl sm:text-2xl font-bold theme-text">
                      Current Results
                    </h2>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    {booth?.candidates?.map((candidate, index) => {
                      const percentage =
                        booth.totalVotes > 0
                          ? Math.round(
                              (candidate.voteCount / booth.totalVotes) * 100,
                            )
                          : 0;

                      return (
                        <div
                          key={candidate._id || candidate.id || index}
                          className="bg-theme-surface/50 rounded-lg p-3 sm:p-4 hover:bg-theme-surface transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <div className="flex items-center flex-1">
                              <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-xs font-bold text-accent">
                                  {index + 1}
                                </span>
                              </div>
                              <span className="font-semibold theme-text text-sm sm:text-base">
                                {candidate.name}
                              </span>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg sm:text-xl font-bold text-accent">
                                {percentage}%
                              </div>
                              <div className="text-xs sm:text-sm theme-muted">
                                {candidate.voteCount} votes
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-theme-surface rounded-full h-2 sm:h-3 overflow-hidden border-2 border-slate-500">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                              style={{
                                width: `${percentage}%`,
                                background: `linear-gradient(to right, var(--color-progress-start), var(--color-progress-end))`,
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {permissions.isCreator && (
                    <Button
                      onClick={() => navigate(`/booth/${boothId}/results`)}
                      variant="primary"
                      size="lg"
                      fullWidth
                      className="mt-4 sm:mt-6"
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
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      }
                      iconPosition="left"
                    >
                      View Detailed Results
                    </Button>
                  )}
                </div>
              )}

            {/* Already Voted Message */}
            {permissions.hasVoted && (
              <div
                className="glass-card p-4 sm:p-6 border-success animate-fadeIn"
                style={{ "--stagger-index": 4 }}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-success"
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
                  <div className="flex-1">
                    <div className="font-semibold text-success text-sm sm:text-base">
                      Vote Recorded!
                    </div>
                    <div className="theme-muted text-xs sm:text-sm">
                      Your vote has been saved and counted.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Booth Info */}
            <div
              className="glass-card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 animate-fadeIn"
              style={{ "--stagger-index": 5 }}
            >
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-on-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold theme-text">
                  Booth Information
                </h3>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-theme-surface/50 transition-colors">
                  <span className="theme-muted text-sm sm:text-base">
                    Booth ID:
                  </span>
                  <span className="font-bold theme-text text-base sm:text-lg font-mono">
                    {booth?.boothId}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-theme-surface/50 transition-colors">
                  <span className="theme-muted text-sm sm:text-base">
                    Created by:
                  </span>
                  <span className="font-semibold theme-text text-sm sm:text-base">
                    {booth?.creator?.name}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-theme-surface/50 transition-colors">
                  <span className="theme-muted text-sm sm:text-base">
                    Created:
                  </span>
                  <span className="font-semibold theme-text text-sm sm:text-base">
                    {booth?.createdAt
                      ? new Date(booth.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-theme-surface/50 transition-colors">
                  <span className="theme-muted text-sm sm:text-base">
                    Members:
                  </span>
                  <span className="font-semibold theme-text text-sm sm:text-base">
                    {membersCount} / {maxMembersDisplay}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-theme-surface/50 transition-colors">
                  <span className="theme-muted text-sm sm:text-base">
                    Status:
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booth?.status === "active"
                        ? "bg-success/10 text-success border border-success/20"
                        : booth?.status === "draft"
                          ? "bg-warning/10 text-warning border border-warning/20"
                          : "bg-error/10 text-error border border-error/20"
                    }`}
                  >
                    {booth?.status?.charAt(0).toUpperCase() +
                      booth?.status?.slice(1)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-theme-surface/50 transition-colors">
                  <span className="theme-muted text-sm sm:text-base">
                    Type:
                  </span>
                  <span className="font-semibold text-secondary text-sm sm:text-base">
                    Private
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal - lazy loaded */}
      {qrModalData && (
        <Suspense fallback={null}>
          <QRCodeModal
            data={qrModalData}
            onClose={() => setQrModalData(null)}
            onDownload={downloadQRCode}
          />
        </Suspense>
      )}
      </div>

      {/* Vote Success Confirmation Modal with Celebration Animation */}
      <VoteSuccessConfirmationModal
        isOpen={voteSuccessModal.open}
        onClose={() => setVoteSuccessModal({ open: false, candidateName: "" })}
        candidateName={voteSuccessModal.candidateName}
        onViewResults={() => {
          setVoteSuccessModal({ open: false, candidateName: "" });
          navigate(`/booth/${boothId}/results`);
        }}
        canViewResults={Boolean(booth?.settings?.resultsVisibleToVoters || permissions.isCreator)}
      />
    </div>
  );
};



const VoteSuccessConfirmationModal = ({ isOpen, onClose, candidateName, onViewResults, canViewResults }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-md theme-surface rounded-t-3xl sm:rounded-3xl p-6 pb-28 sm:pb-8 shadow-2xl border border-border animate-slideUp text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Celebration Icon */}
        <div className="w-20 h-20 rounded-full bg-success/15 text-success border-2 border-success/30 flex items-center justify-center mx-auto my-4 shadow-lg animate-bounce">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-xl font-bold theme-text mb-1">Vote Recorded!</h3>
        <p className="text-xs sm:text-sm theme-muted leading-relaxed max-w-xs mx-auto mb-6">
          Your vote has been saved and counted.
        </p>

        <div className="space-y-2.5">
          {canViewResults && (
            <button
              type="button"
              onClick={onViewResults}
              className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Results
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl theme-surface border border-border theme-text font-semibold text-sm hover:bg-accent-50 active:scale-95 transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};



export default BoothDetailPage;
