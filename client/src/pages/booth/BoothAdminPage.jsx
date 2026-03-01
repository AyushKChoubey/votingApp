import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { boothService } from "../../services/api";
import { Alert } from "../../components/layout/Alert";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";
import { useToast } from "../../components/layout/Toast";
import ConfirmModal from "../../components/layout/ConfirmModal";
import Button from "../../components/layout/Button";
import { QRCodeModal } from "../../components/booth/QRCodeModal";

// Helper function to convert ISO datetime to datetime-local format
const toDatetimeLocal = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const BoothAdminPage = () => {
  const { boothId } = useParams();
  const navigate = useNavigate();

  const [booth, setBooth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToast();

  const [settings, setSettings] = useState({});
  const [editingSettings, setEditingSettings] = useState(false);
  const [removingMembers, setRemovingMembers] = useState(new Set());
  const [pendingActionLoading, setPendingActionLoading] = useState(new Set());
  const [confirm, setConfirm] = useState({
    open: false,
    action: null,
    payload: null,
    loading: false,
  });
  const [candidatesOpen, setCandidatesOpen] = useState(true);
  const [qrModalData, setQrModalData] = useState(null);
  const [countdownText, setCountdownText] = useState(null);
  const lastStatusRef = useRef(null);

  // Activity tab state
  const [activeTab, setActiveTab] = useState("overview");
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");
  const [activitiesFetched, setActivitiesFetched] = useState(false);

  useEffect(() => {
    fetchBoothDetails();
    // Reset activities fetch flag when booth changes
    setActivitiesFetched(false);
  }, [boothId]);

  // Countdown timer for scheduled booths (admin view)
  useEffect(() => {
    let timer = null;

    const compute = () => {
      const settingsObj = settings || {};
      const start = settingsObj.votingStartTime
        ? new Date(settingsObj.votingStartTime)
        : null;
      const end = settingsObj.votingEndTime
        ? new Date(settingsObj.votingEndTime)
        : null;
      const now = new Date();

      let currentStatus = null;

      if (!start && !end) {
        setCountdownText(null);
        return;
      }

      if (start && now < start) {
        const ms = start - now;
        setCountdownText(`Starts in ${formatDuration(ms)}`);
        currentStatus = "waiting";
        lastStatusRef.current = currentStatus;
        return;
      }

      if (end && (!start || now >= start) && now < end) {
        const ms = end - now;
        setCountdownText(`Time remaining ${formatDuration(ms)}`);
        currentStatus = "active";

        // Transition from waiting to active - refetch booth to update toggle
        if (lastStatusRef.current === "waiting") {
          fetchBoothDetails();
        }
        lastStatusRef.current = currentStatus;
        return;
      }

      if (end && now >= end) {
        setCountdownText(`Voting ended`);
        currentStatus = "ended";

        // Transition to ended - refetch booth to update toggle
        if (lastStatusRef.current === "active") {
          fetchBoothDetails();
        }
        lastStatusRef.current = currentStatus;
        return;
      }

      setCountdownText(null);
    };

    // admin is creator, show countdown
    compute();
    timer = setInterval(compute, 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [settings]);

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

  useEffect(() => {
    if (error && booth) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, booth]);

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

  const fetchBoothDetails = async () => {
    try {
      setLoading(true);
      setError("");
      // Use admin API so we get pendingRequests populated for display
      const response = await boothService.getAdmin(boothId);

      if (response.success && response.data) {
        setBooth(response.data.booth);
        const srvSettings = response.data.booth.settings || {};

        // Ensure UI flags reflect existing settings
        setSettings({
          ...srvSettings,
          votingStartTime: toDatetimeLocal(srvSettings.votingStartTime),
          votingEndTime: toDatetimeLocal(srvSettings.votingEndTime),
          restrictByEmailDomain:
            Array.isArray(srvSettings.allowedEmailDomains) &&
            srvSettings.allowedEmailDomains.length > 0,
          // show schedule toggle when any schedule values exist
          scheduled: !!(
            srvSettings.votingStartTime || srvSettings.votingEndTime
          ),
        });

        if (!response.data?.permissions?.isCreator) {
          setError("You are not authorized to manage this booth");
          return;
        }
      } else {
        setError(response.error || "Failed to load booth details");
      }
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 403) {
        setError("You are not authorized to access this booth");
      } else if (status === 404) {
        setError("Booth not found");
      } else {
        setError(err.message || "Failed to load booth details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setUpdating(true);
      setError("");

      const response = await boothService.updateSettings(boothId, settings);

      if (response.success) {
        // refresh data first, then notify user so toasts reflect final state
        await fetchBoothDetails();
        setEditingSettings(false);
        addToast("Settings updated successfully", "success");
      } else {
        setError(response.error || "Failed to update settings");
        addToast(response.error || "Failed to update settings", "error");
      }
    } catch (err) {
      setError(err.message || "Failed to update settings");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = booth.status === "active" ? "closed" : "active";
    setConfirm({
      open: true,
      action: "toggleStatus",
      payload: { newStatus },
      title: `${newStatus === "active" ? "Activate" : "Close"} booth`,
      description: `Are you sure you want to ${newStatus === "active" ? "activate" : "close"} this booth?`,
    });
    return;
  };

  const handleResetInviteCode = async () => {
    setConfirm({
      open: true,
      action: "resetInvite",
      payload: null,
      title: "Reset invite code",
      description:
        "Generating a new invite code invalidates the previous code and links — anyone using the old link will no longer be able to join. Continue?",
    });
    return;
  };

  const handleRemoveMember = async (memberId) => {
    setConfirm({
      open: true,
      action: "removeMember",
      payload: { memberId },
      title: "Remove member",
      description:
        "Are you sure you want to remove this member from the booth? This action will also remove their votes.",
    });
    return;
  };

  const handleApproveRequest = async (userId) => {
    setPendingActionLoading((prev) => new Set(prev).add(userId));
    try {
      const response = await boothService.approveRequest(boothId, userId);
      if (response.success) {
        await fetchBoothDetails();
        addToast("Member approved", "success");
      } else {
        addToast(response.error || "Failed to approve request", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to approve request", "error");
    } finally {
      setPendingActionLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (userId) => {
    setPendingActionLoading((prev) => new Set(prev).add(userId));
    try {
      const response = await boothService.rejectRequest(boothId, userId);
      if (response.success) {
        await fetchBoothDetails();
        addToast("Join request rejected", "success");
      } else {
        addToast(response.error || "Failed to reject request", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to reject request", "error");
    } finally {
      setPendingActionLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDeleteBooth = async () => {
    setConfirm({
      open: true,
      action: "deleteBooth",
      payload: null,
      title: "Delete booth",
      description:
        "Are you sure you want to permanently delete this booth? Members will lose access and this action cannot be undone.",
      requireText: "DELETE",
      confirmLabel: "Delete booth",
    });
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Central confirm handler invoked by ConfirmModal
  const onConfirm = async () => {
    const { action, payload } = confirm;
    try {
      if (action === "toggleStatus") {
        setConfirm((prev) => ({ ...prev, loading: true }));
        try {
          const response = await boothService.toggleStatus(boothId);
          if (response.success) {
            await fetchBoothDetails();
            addToast("Booth status updated", "success");
          } else {
            addToast(response.error || "Failed to toggle status", "error");
          }
        } catch (err) {
          // If schedule expired, show a helpful warning and open settings to update schedule
          const status = err?.response?.status || err?.status;
          const isExpired =
            status === 400 &&
            (err?.data?.code === "SCHEDULE_EXPIRED" ||
              /voting period has already ended/i.test(
                err?.data?.error || err?.message || "",
              ));
          if (isExpired) {
            addToast(
              "Cannot activate: voting period already ended. Update schedule or disable scheduling to reopen.",
              "warning",
            );
            // Open settings so admin can update times
            setEditingSettings(true);
            setError(
              "Voting period ended — update schedule or disable scheduling to reopen voting.",
            );
            // Refresh booth details to reflect auto-closed state
            try {
              await fetchBoothDetails();
            } catch (e) {
              /* ignore */
            }
          } else {
            addToast(err.message || "Action failed", "error");
          }
        }
      }

      if (action === "resetInvite") {
        setConfirm((prev) => ({ ...prev, loading: true }));
        const response = await boothService.resetInviteCode(boothId);
        if (response.success) {
          await fetchBoothDetails();
          addToast("Invite code reset successfully", "success");
        } else {
          addToast(response.error || "Failed to reset invite code", "error");
        }
      }

      if (action === "removeMember") {
        const memberId = payload.memberId;
        setRemovingMembers((prev) => new Set(prev).add(memberId));
        setConfirm((prev) => ({ ...prev, loading: true }));
        const response = await boothService.removeMember(boothId, memberId);
        if (response.success) {
          await fetchBoothDetails();
          addToast("Member removed successfully", "success");
        } else {
          addToast(response.error || "Failed to remove member", "error");
        }
        setRemovingMembers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(memberId);
          return newSet;
        });
      }

      if (action === "removeCandidate") {
        // payload: { index }
        const index = payload?.index;
        if (typeof index !== "number") {
          addToast("Invalid candidate selected", "error");
        } else if (booth?.candidates?.length <= 2) {
          addToast("Cannot delete - minimum 2 candidates required", "error");
        } else {
          setConfirm((prev) => ({ ...prev, loading: true }));
          try {
            // Build updated candidate list
            const updated = (booth?.candidates || []).filter(
              (_, i) => i !== index,
            );
            const response = await boothService.updateBooth(boothId, {
              candidates: updated,
            });
            if (response && response.success) {
              await fetchBoothDetails();
              addToast("Candidate removed", "success");
            } else {
              await fetchBoothDetails();
              addToast(
                response?.error || "Failed to remove candidate",
                "error",
              );
            }
          } catch (err) {
            await fetchBoothDetails();
            addToast(err.message || "Failed to remove candidate", "error");
          }
        }
      }

      if (action === "deleteBooth") {
        setConfirm((prev) => ({ ...prev, loading: true }));
        const response = await boothService.deleteBooth(boothId);
        if (response.success) {
          addToast("Booth deleted successfully", "success");
          navigate("/dashboard");
        } else {
          addToast(response.error || "Failed to delete booth", "error");
        }
      }
    } catch (err) {
      addToast(err.message || "Action failed", "error");
    } finally {
      setConfirm({ open: false, action: null, payload: null, loading: false });
    }
  };

  const onCancel = () => {
    setConfirm({ open: false, action: null, payload: null, loading: false });
  };

  const copyToClipboard = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(message || "Copied to clipboard", "success");
    } catch (err) {
      addToast("Failed to copy to clipboard", "error");
    }
  };

  // Inline share/copy feedback (used in invite card) — avoids using global toasts in that card
  const [shareStatus, setShareStatus] = useState("");
  const clearShareStatus = () => setTimeout(() => setShareStatus(""), 3500);

  const copyAndShowInline = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      setShareStatus(message || "Copied to clipboard");
      clearShareStatus();
    } catch (err) {
      setShareStatus("Failed to copy to clipboard");
      clearShareStatus();
    }
  };

  const handleShareInvite = async () => {
    if (!booth || !booth.inviteCode) return;
    const joinLink = `${window.location.origin}/booth/join/${booth.inviteCode}`;
    const message = `You're invited to join \"${booth.name}\"!\n\n${booth.description || ""}\n\nJoin with code: ${booth.inviteCode}\nOr open: ${joinLink}\n\nSee you there!`;

    // Use native share when available (mobile), otherwise copy fallback
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join: ${booth.name}`,
          text: message,
          url: joinLink,
        });
        return;
      } catch (err) {
        // If user cancelled share, silently ignore. Otherwise fallback to copy.
        if (err.name !== "AbortError") {
          await copyToClipboard(message, "Invite message copied to clipboard");
        }
        return;
      }
    }

    // Fallback: copy message to clipboard and notify
    await copyToClipboard(message, "Invite message copied to clipboard");
  };

  const fetchActivity = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError("");
      const res = await boothService.getActivity(boothId);
      if (res.success && res.data) {
        setActivities(res.data.activities || []);
      } else {
        setActivitiesError(res.error || "Failed to load activity");
      }
    } catch (err) {
      setActivitiesError(err.message || "Failed to load activity");
    } finally {
      setActivitiesLoading(false);
      setActivitiesFetched(true);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "activity" && !activitiesFetched) {
      fetchActivity();
    }
  };

  const formatRelativeTime = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);

    // Validate the date
    if (isNaN(date.getTime())) {
      return "";
    }

    const diffMs = now - date;

    // Handle future dates
    if (diffMs < 0) {
      const absDiffMs = Math.abs(diffMs);
      const diffSec = Math.floor(absDiffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 60) return "soon";
      if (diffMin < 60)
        return `in ${diffMin} minute${diffMin !== 1 ? "s" : ""}`;
      if (diffHr < 24) return `in ${diffHr} hour${diffHr !== 1 ? "s" : ""}`;
      if (diffDay < 30) return `in ${diffDay} day${diffDay !== 1 ? "s" : ""}`;
      return date.toLocaleDateString();
    }

    // Handle past dates
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <PageLoading message="Loading booth administration..." />;
  }

  if (error && !booth) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="theme-surface rounded-2xl shadow-xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-error-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-error"
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
            <h2 className="text-xl sm:text-2xl font-bold theme-text mb-3">
              Access Denied
            </h2>
            <p className="theme-muted text-sm sm:text-base mb-6">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full btn-theme py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none float">
        <div
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl opacity-20"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary), var(--color-accent))",
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
        <div className="mb-1 animate-fadeIn">
          {/* Title and Status Toggle Row */}
          <div className="flex items-start justify-center pt-1 sm:pt-2 mb-2 relative">
            <div className="text-center max-w-4xl mx-auto px-4 sm:px-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 break-words">
                <span className="text-gradient">Admin Dashboard</span>
              </h1>
              <p className="text-sm sm:text-base theme-muted font-mono font-semibold mb-1">
                Booth ID: {booth?.boothId}
              </p>
              <p className="text-base sm:text-lg font-semibold theme-text break-words">
                {booth?.name}
              </p>
            </div>

            {/* Status Toggle (absolute right side) */}
            <div className="absolute right-0 top-2 sm:top-3">
              <div className="text-right">
                <div className="text-sm font-bold theme-text mb-2">Status</div>

                <button
                  onClick={handleToggleStatus}
                  disabled={updating}
                  aria-label="Toggle booth status"
                  className={`relative inline-flex mt-0 h-5 w-10 items-center rounded-full transition-all focus:outline-none focus-ring disabled:opacity-50 disabled:cursor-not-allowed ${
                    booth?.status === "active"
                      ? "bg-success-50 border-success"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                      booth?.status === "active"
                        ? "translate-x-6"
                        : "translate-x-0"
                    }`}
                  />
                </button>

                <div
                  className={`mt-1 text-xs font-bold ${booth?.status === "active" ? "text-success" : "text-error"}`}
                >
                  {booth?.status === "active" ? "Active" : "Closed"}
                </div>
              </div>
            </div>
          </div>

          {/* Status Badges (centered) */}
          <div
            className="flex flex-wrap justify-center gap-2 animate-fadeIn mb-4"
            style={{ "--stagger-index": 2 }}
          >
            {(settings.allowedEmailDomains &&
              settings.allowedEmailDomains.length > 0) ||
            settings.restrictByEmailDomain ? (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-accent/10 text-accent border border-accent/20">
                DOMAIN RESTRICTED
              </span>
            ) : null}

            {settings.scheduled &&
              (settings.votingStartTime || settings.votingEndTime) && (
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-secondary/10 text-secondary border border-secondary/20">
                  SCHEDULED
                </span>
              )}
            {countdownText && (
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

          {/* Quick Actions (centered below badges) */}
          <div
            className="flex flex-row gap-3 justify-center animate-fadeIn mb-3"
            style={{ "--stagger-index": 3 }}
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
              View
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

          {/* Status Toggle moved to header */}
          {/* Tab Bar */}
          <div
            className="flex items-center gap-1 p-1 glass-card rounded-xl w-fit mx-auto animate-fadeIn mb-4"
            style={{ "--stagger-index": 4 }}
          >
            <button
              onClick={() => handleTabChange("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "overview"
                  ? "bg-accent/20 text-accent border border-accent/30 shadow-sm"
                  : "theme-muted hover:text-accent hover:bg-accent/10"
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  activeTab === "overview" ? "text-accent" : "text-accent/60"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Overview
            </button>
            <button
              onClick={() => handleTabChange("activity")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "activity"
                  ? "bg-accent/20 text-accent border border-accent/30 shadow-sm"
                  : "theme-muted hover:text-accent hover:bg-accent/10"
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  activeTab === "activity" ? "text-accent" : "text-accent/60"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Activity
            </button>
          </div>
        </div>

        {/* Alerts (errors only; success uses toasts) */}
        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} />
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === "activity" && (
          <div className="animate-fadeIn">
            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent dark:from-primary/80 dark:to-accent/80 rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold theme-text">
                    Activity Timeline
                  </h3>
                </div>
                <button
                  onClick={fetchActivity}
                  disabled={activitiesLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold theme-muted hover:theme-text transition-colors disabled:opacity-50"
                >
                  <svg
                    className={`w-3.5 h-3.5 ${activitiesLoading ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>

              {activitiesLoading && (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start animate-pulse"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary/30 mt-2 shrink-0" />
                      <div className="flex-1">
                        <div className="h-3.5 bg-primary/10 rounded w-3/4 mb-1.5" />
                        <div className="h-2.5 bg-primary/10 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!activitiesLoading && activitiesError && (
                <div className="text-center py-8">
                  <p className="text-error text-sm">{activitiesError}</p>
                </div>
              )}

              {!activitiesLoading &&
                !activitiesError &&
                activities.length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-primary/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="theme-muted text-sm">No activity yet</p>
                  </div>
                )}

              {!activitiesLoading &&
                !activitiesError &&
                activities.length > 0 && (
                  <ol className="relative border-l-2 border-primary/20 ml-2 space-y-0">
                    {activities.map((activity, idx) => (
                      <li key={activity.id || idx} className="mb-6 ml-5">
                        <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 border-2 border-primary/40" />
                        <p className="text-sm font-medium theme-text leading-snug mb-0.5">
                          {activity.message}
                        </p>
                        <time className="text-xs theme-muted">
                          {formatRelativeTime(activity.createdAt)}
                        </time>
                      </li>
                    ))}
                  </ol>
                )}
            </div>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            <div
              className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8 animate-fadeIn"
              style={{ "--stagger-index": 3 }}
            >
              {/* Total Votes */}
              <div className="glass-card p-3 sm:p-4 text-center card-hover transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform duration-300">
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
                <div className="text-xs theme-muted font-medium">
                  Total Votes
                </div>
              </div>

              {/* Members */}
              <div className="glass-card p-3 sm:p-4 text-center card-hover transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform duration-300">
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

              {/* Candidates */}
              <div className="glass-card p-3 sm:p-4 text-center card-hover transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform duration-300">
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
                <div className="text-xs theme-muted font-medium">
                  Candidates
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-4">
                {/* Invite Code & Link Card */}
                <div className="glass-card p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 relative z-10">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mr-3">
                        <svg
                          className="w-4 h-4 text-accent"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1 1 21 9z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold theme-text">
                        Invite Code
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 relative z-50">
                      <button
                        onClick={handleResetInviteCode}
                        disabled={updating}
                        className="bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-700 hover:text-red-700 font-semibold disabled:opacity-50 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs sm:text-sm border border-orange-200 hover:border-red-200"
                      >
                        Reset
                      </button>

                      {/* Info tooltip for reset button */}
                      <div className="relative group inline-block">
                        <button
                          type="button"
                          aria-label="What does reset do"
                          className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white text-xs font-medium transition-all duration-300 shadow-md"
                        >
                          i
                        </button>
                        <div className="pointer-events-none absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-gray-800 text-white text-xs leading-tight rounded-lg shadow-xl px-3 py-2 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all z-[100]">
                          Generating a new invite code invalidates the previous
                          code and links — anyone using the old link will no
                          longer be able to join. Use this when you want to
                          block existing invite links.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Code Display */}
                  <div className="theme-surface rounded-xl p-3 sm:p-4 mb-3 border-2 border-accent/30">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-lg sm:text-xl font-bold text-accent tracking-widest">
                        {booth?.inviteCode}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            booth?.inviteCode,
                            "Code copied to clipboard",
                          )
                        }
                        className="p-2 hover:bg-accent/10 rounded-xl transition-all group"
                        title="Copy code"
                      >
                        <svg
                          className="w-5 h-5 text-accent group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Link Display */}
                  <div>
                    <div className="text-xs sm:text-sm theme-muted mb-2 flex items-center font-medium">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      Join Link
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 theme-surface rounded-xl px-3 py-2 text-xs sm:text-sm font-mono theme-text overflow-hidden text-ellipsis whitespace-nowrap border border-border">
                        {`${window.location.origin}/booth/join/${booth?.inviteCode}`}
                      </div>
                      <Button
                        onClick={() =>
                          copyToClipboard(
                            `${window.location.origin}/booth/join/${booth?.inviteCode}`,
                            "Link copied to clipboard",
                          )
                        }
                        variant="primary"
                        size="sm"
                        icon={
                          <svg
                            className="w-4 h-4 sm:hidden"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        }
                      >
                        <span className="hidden sm:inline">Copy</span>
                      </Button>
                      <Button
                        onClick={handleShareInvite}
                        variant="secondary"
                        size="sm"
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
                              d="M4 12v.01M12 12v.01M20 12v.01M4 12a8 8 0 0116 0M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8"
                            />
                          </svg>
                        }
                      >
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                      <Button
                        onClick={showQRCode}
                        variant="outline"
                        size="sm"
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
                              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                            />
                          </svg>
                        }
                      >
                        <span className="hidden sm:inline">QR</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Settings Card */}
                <div className="glass-card p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mr-3">
                        <svg
                          className="w-4 h-4 text-accent"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold theme-text">
                        Settings
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        if (editingSettings) {
                          const srvSettings = booth.settings || {};
                          setSettings({
                            ...srvSettings,
                            votingStartTime: toDatetimeLocal(
                              srvSettings.votingStartTime,
                            ),
                            votingEndTime: toDatetimeLocal(
                              srvSettings.votingEndTime,
                            ),
                            restrictByEmailDomain:
                              Array.isArray(srvSettings.allowedEmailDomains) &&
                              srvSettings.allowedEmailDomains.length > 0,
                            scheduled: !!(
                              srvSettings.votingStartTime ||
                              srvSettings.votingEndTime
                            ),
                          });
                        }
                        setEditingSettings(!editingSettings);
                      }}
                      className={`font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 text-xs sm:text-sm hover:scale-[1.02] active:scale-[0.98] ${
                        editingSettings
                          ? "theme-surface hover:bg-accent/10 theme-text border border-border"
                          : "bg-gradient-to-r from-accent/20 to-primary/20 hover:from-accent/30 hover:to-primary/30 text-accent border border-accent/30"
                      }`}
                    >
                      {editingSettings ? "Cancel" : "Edit"}
                    </button>
                  </div>

                  {editingSettings ? (
                    <div className="space-y-6">
                      {/* Voting Rules */}
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-medium theme-text">
                          Voting Rules
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="flex items-start sm:items-center justify-between p-3 theme-surface hover:bg-accent/5 rounded-xl cursor-pointer transition-all border border-border">
                            <span className="text-xs sm:text-sm theme-text font-medium pr-2">
                              Results visible to voters
                            </span>
                            <input
                              type="checkbox"
                              checked={settings.resultsVisibleToVoters || false}
                              onChange={(e) =>
                                handleSettingChange(
                                  "resultsVisibleToVoters",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 sm:w-5 sm:h-5 text-accent rounded focus:ring-2 focus:ring-accent cursor-pointer flex-shrink-0"
                            />
                          </label>

                          <label className="flex items-start sm:items-center justify-between p-3 theme-surface hover:bg-accent/5 rounded-xl cursor-pointer transition-all border border-border">
                            <span className="text-xs sm:text-sm theme-text font-medium pr-2">
                              Show live results
                            </span>
                            <input
                              type="checkbox"
                              checked={settings.showLiveResults || false}
                              onChange={(e) =>
                                handleSettingChange(
                                  "showLiveResults",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 sm:w-5 sm:h-5 text-accent rounded focus:ring-2 focus:ring-accent cursor-pointer flex-shrink-0"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Access Control */}
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-medium theme-text">
                          Access Control
                        </h3>
                        <div className="space-y-3">
                          <label className="flex items-start sm:items-center justify-between p-3 theme-surface hover:bg-accent/5 rounded-xl cursor-pointer transition-all border border-border">
                            <span className="text-xs sm:text-sm theme-text font-medium pr-2">
                              Require approval
                            </span>
                            <input
                              type="checkbox"
                              checked={settings.requireApproval || false}
                              onChange={(e) =>
                                handleSettingChange(
                                  "requireApproval",
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 sm:w-5 sm:h-5 text-accent rounded focus:ring-2 focus:ring-accent cursor-pointer flex-shrink-0"
                            />
                          </label>

                          <div className="p-3 theme-surface rounded-xl border border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 pr-3">
                                <label className="text-sm font-medium theme-text">
                                  Restrict by email domain
                                </label>
                                <p className="text-sm theme-muted">
                                  Only allow members with emails from listed
                                  domains to join.
                                </p>
                              </div>

                              <div className="flex-shrink-0">
                                <input
                                  id="restrictByEmailDomain"
                                  type="checkbox"
                                  checked={
                                    settings.restrictByEmailDomain || false
                                  }
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    handleSettingChange(
                                      "restrictByEmailDomain",
                                      checked,
                                    );
                                    if (!checked) {
                                      handleSettingChange(
                                        "allowedEmailDomains",
                                        [],
                                      );
                                    }
                                  }}
                                  className="mt-1 h-4 w-4 text-accent theme-surface border-border rounded focus:ring-accent"
                                />
                              </div>
                            </div>

                            {settings.restrictByEmailDomain && (
                              <div className="mt-3">
                                <input
                                  type="text"
                                  value={(
                                    settings.allowedEmailDomains || []
                                  ).join(", ")}
                                  onChange={(e) =>
                                    handleSettingChange(
                                      "allowedEmailDomains",
                                      String(e.target.value || "")
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    )
                                  }
                                  placeholder="example.com, organization.org"
                                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent theme-surface theme-text"
                                />
                                <p className="text-xs mt-1 theme-muted">
                                  Comma separated domains to restrict who can
                                  join. Leave blank to allow any domain.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Time Settings */}
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-medium theme-text">
                          Voting Schedule (Optional)
                        </h3>

                        <label className="flex items-start sm:items-center justify-between p-3 theme-surface hover:bg-accent/5 rounded-xl cursor-pointer transition-all border border-border">
                          <div className="flex-1 pr-3">
                            <span className="text-xs sm:text-sm theme-text font-medium">
                              Schedule voting
                            </span>
                            <p className="text-sm theme-muted">
                              Enable start/end times to schedule when voting is
                              allowed.
                            </p>
                          </div>

                          <div className="flex-shrink-0">
                            <input
                              id="enableSchedule"
                              type="checkbox"
                              checked={settings.scheduled || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                handleSettingChange("scheduled", checked);
                                if (!checked) {
                                  handleSettingChange("votingStartTime", "");
                                  handleSettingChange("votingEndTime", "");
                                }
                              }}
                              className="mt-1 h-4 w-4 text-accent theme-surface border-border rounded focus:ring-accent"
                            />
                          </div>
                        </label>

                        {settings.scheduled && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium theme-text mb-1">
                                Voting Start Time
                              </label>
                              <input
                                type="datetime-local"
                                value={settings.votingStartTime || ""}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "votingStartTime",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 theme-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent theme-text"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium theme-text mb-1">
                                Voting End Time
                              </label>
                              <input
                                type="datetime-local"
                                value={settings.votingEndTime || ""}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "votingEndTime",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 theme-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent theme-text"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4">
                        <LoadingButton
                          onClick={handleUpdateSettings}
                          loading={updating}
                          className="flex-1 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 dark:from-accent/90 dark:to-primary/90 dark:hover:from-accent/80 dark:hover:to-primary/80 disabled:opacity-50 text-white py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                        >
                          Save Changes
                        </LoadingButton>
                        <button
                          onClick={() => {
                            const srvSettings = booth.settings || {};
                            setSettings({
                              ...srvSettings,
                              votingStartTime: toDatetimeLocal(
                                srvSettings.votingStartTime,
                              ),
                              votingEndTime: toDatetimeLocal(
                                srvSettings.votingEndTime,
                              ),
                              restrictByEmailDomain:
                                Array.isArray(
                                  srvSettings.allowedEmailDomains,
                                ) && srvSettings.allowedEmailDomains.length > 0,
                              scheduled: !!(
                                srvSettings.votingStartTime ||
                                srvSettings.votingEndTime
                              ),
                            });
                            setEditingSettings(false);
                          }}
                          className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold transition-all duration-300 border border-gray-300 dark:border-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center p-2.5 theme-surface rounded-lg border border-border">
                        <span
                          className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.resultsVisibleToVoters ? "bg-green-500" : "bg-border"}`}
                        ></span>
                        <span className="text-xs theme-text">
                          Results visible
                        </span>
                      </div>

                      <div className="flex items-center p-2.5 theme-surface rounded-lg border border-border">
                        <span
                          className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.showLiveResults ? "bg-green-500" : "bg-border"}`}
                        ></span>
                        <span className="text-xs theme-text">Live results</span>
                      </div>

                      <div className="flex items-center p-2.5 theme-surface rounded-lg border border-border">
                        <span
                          className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.requireApproval ? "bg-green-500" : "bg-border"}`}
                        ></span>
                        <span className="text-xs theme-text">
                          Require approval
                        </span>
                      </div>

                      <div className="flex items-center p-2.5 theme-surface rounded-lg border border-border">
                        <span
                          className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.restrictByEmailDomain || (settings.allowedEmailDomains && settings.allowedEmailDomains.length > 0) ? "bg-green-500" : "bg-border"}`}
                        ></span>
                        <span className="text-xs theme-text">
                          Domain restriction
                        </span>
                      </div>

                      <div className="flex items-center p-2.5 theme-surface rounded-lg col-span-2 border border-border">
                        <span
                          className={`w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0 ${settings.scheduled || settings.votingStartTime || settings.votingEndTime ? "bg-green-500" : "bg-border"}`}
                        ></span>
                        <span className="text-xs theme-text">Scheduled</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Candidates Management Card */}
                <div className="glass-card p-4 sm:p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setCandidatesOpen((prev) => !prev)}
                      aria-expanded={candidatesOpen}
                      className="flex items-center gap-3 focus:outline-none"
                    >
                      <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mr-3">
                        <svg
                          className="w-4 h-4 text-accent"
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
                      <h3 className="text-lg sm:text-xl font-bold theme-text">
                        Candidates
                      </h3>
                      <span className="ml-2 text-xs theme-muted hidden sm:inline">
                        {booth?.candidates?.length || 0} items
                      </span>
                    </button>
                    <button
                      onClick={() => setCandidatesOpen((prev) => !prev)}
                      aria-label={
                        candidatesOpen
                          ? "Collapse candidates"
                          : "Expand candidates"
                      }
                      className="p-1 rounded-md hover:bg-accent/10 theme-text"
                    >
                      <svg
                        className={`w-4 h-4 transform transition-transform ${candidatesOpen ? "rotate-180" : "rotate-0"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {candidatesOpen && (
                    <>
                      {/* If votes exist, candidate edits are locked */}
                      {booth?.totalVotes > 0 ? (
                        <div className="mb-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-warning">
                          Candidate editing is locked — this booth already has{" "}
                          <strong>{booth.totalVotes}</strong> vote
                          {booth.totalVotes > 1 ? "s" : ""} recorded. To prevent
                          audit issues, you cannot add or remove candidates once
                          votes exist. If you need to change candidates,
                          consider exporting the booth data and recreating the
                          booth.
                        </div>
                      ) : (
                        <div className="mb-3 p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm text-accent">
                          No votes recorded yet — you can add, remove, and
                          reorder candidates freely. Changes must be saved to
                          take effect.
                        </div>
                      )}

                      {/* Candidate list (compact) */}
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                          {booth?.candidates?.map((candidate, idx) => (
                            <div
                              key={candidate.id || candidate.name + idx}
                              className="flex items-center justify-between p-2 theme-surface rounded-lg border border-border hover:bg-accent/5 transition-all text-sm"
                            >
                              <div className="min-w-0">
                                <div className="font-medium theme-text truncate">
                                  {candidate.name}
                                </div>
                                {candidate.description && (
                                  <div className="text-xs theme-muted truncate">
                                    {candidate.description}
                                  </div>
                                )}
                              </div>

                              <div className="ml-3 flex items-center gap-2">
                                <div className="text-xs theme-muted">
                                  {candidate.voteCount || 0} votes
                                </div>
                                {/* Remove button only when no votes and more than 2 candidates */}
                                <button
                                  onClick={() => {
                                    if (
                                      booth?.totalVotes > 0 ||
                                      booth?.candidates?.length <= 2
                                    )
                                      return;
                                    setConfirm({
                                      open: true,
                                      action: "removeCandidate",
                                      payload: { index: idx },
                                      title: "Remove candidate",
                                      description: `Remove candidate "${candidate.name}"? This cannot be undone.`,
                                    });
                                  }}
                                  disabled={
                                    booth?.totalVotes > 0 ||
                                    booth?.candidates?.length <= 2
                                  }
                                  className={`p-1 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-red-100`}
                                  title={
                                    booth?.totalVotes > 0
                                      ? "Locked while votes exist"
                                      : booth?.candidates?.length <= 2
                                        ? "Cannot delete - minimum 2 candidates required"
                                        : "Remove candidate"
                                  }
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
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add candidate area (only when no votes) */}
                        {booth?.totalVotes === 0 && (
                          <div className="pt-2">
                            <AddCandidateInline
                              onAdd={async (newCandidate) => {
                                // optimistic UI update: append candidate locally and attempt to persist
                                const updated = [
                                  ...(booth?.candidates || []),
                                  { ...newCandidate, voteCount: 0 },
                                ];
                                setBooth((prev) => ({
                                  ...prev,
                                  candidates: updated,
                                }));
                                try {
                                  const response =
                                    await boothService.updateBooth(boothId, {
                                      candidates: updated,
                                    });
                                  if (response && response.success) {
                                    addToast("Candidates updated", "success");
                                    await fetchBoothDetails();
                                  } else {
                                    addToast(
                                      response?.error ||
                                        "Failed to save candidates",
                                      "error",
                                    );
                                    await fetchBoothDetails();
                                  }
                                } catch (err) {
                                  addToast(
                                    err.message || "Failed to save candidates",
                                    "error",
                                  );
                                  await fetchBoothDetails();
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Deleted duplicate mobile block — single Danger Zone appears at the end of the page now */}
              </div>

              {/* Right Column - Members */}
              <div className="space-y-4">
                {/* Members Container with compact mobile height */}
                <div className="glass-card p-4 sm:p-6 h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mr-3">
                        <svg
                          className="w-4 h-4 text-accent"
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
                      <h3 className="text-lg sm:text-xl font-bold theme-text">
                        Members
                      </h3>
                    </div>
                    <span className="bg-gradient-to-r from-primary/20 to-secondary/20 dark:from-primary/30 dark:to-secondary/30 text-primary dark:text-primary/90 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-full border border-primary/30 dark:border-primary/40 shadow-sm">
                      {booth?.members?.length || 0}{" "}
                      {booth?.members?.length === 1 ? "member" : "members"}
                    </span>
                  </div>

                  {/* Scrollable members list */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                    {/* Pending join requests (when requireApproval is enabled) */}
                    {booth?.pendingRequests &&
                      booth.pendingRequests.length > 0 && (
                        <div className="mb-4 p-3 theme-surface rounded-xl border border-warning/40">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-warning/20 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-3.5 h-3.5 text-warning"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold theme-text">
                                Pending Approval
                              </div>
                              <div className="text-xs theme-muted">
                                {booth.pendingRequests.length}{" "}
                                {booth.pendingRequests.length === 1
                                  ? "request"
                                  : "requests"}{" "}
                                waiting
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {booth.pendingRequests.map((req) => (
                              <div
                                key={
                                  (req.user && (req.user.id || req.user)) ||
                                  JSON.stringify(req)
                                }
                                className="flex items-center justify-between p-2 theme-surface hover:bg-accent/5 rounded-lg border border-border hover:shadow-md transition-all"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="w-8 h-8 bg-gradient-to-br from-warning/40 to-warning/20 rounded-lg flex items-center justify-center text-warning font-bold text-xs flex-shrink-0">
                                    {req.user?.name?.charAt(0)?.toUpperCase() ||
                                      "?"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold theme-text text-sm truncate">
                                      {req.user?.name || "Unknown User"}
                                    </div>
                                    <div className="text-xs theme-muted truncate">
                                      {req.user?.email || ""}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                                  <button
                                    onClick={() =>
                                      handleApproveRequest(
                                        req.user.id || req.user,
                                      )
                                    }
                                    disabled={pendingActionLoading.has(
                                      req.user.id || req.user,
                                    )}
                                    className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-sm"
                                    title="Approve"
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
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectRequest(
                                        req.user.id || req.user,
                                      )
                                    }
                                    disabled={pendingActionLoading.has(
                                      req.user.id || req.user,
                                    )}
                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-sm"
                                    title="Reject"
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
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    {booth?.members?.map((member, index) => (
                      <div
                        key={member.id}
                        className="group flex items-center justify-between p-2 theme-surface hover:bg-accent/5 rounded-lg transition-all duration-300 border border-border hover:shadow-md"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                            style={{
                              background: `linear-gradient(135deg, ${
                                [
                                  "#0891b2",
                                  "#8b5cf6",
                                  "#ec4899",
                                  "#f59e0b",
                                  "#10b981",
                                  "#3b82f6",
                                ][index % 6]
                              }, ${
                                [
                                  "#06b6d4",
                                  "#a78bfa",
                                  "#f472b6",
                                  "#fbbf24",
                                  "#34d399",
                                  "#60a5fa",
                                ][index % 6]
                              })`,
                            }}
                          >
                            {member.user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold theme-text text-sm truncate">
                              {member.user?.name || "Unknown User"}
                            </div>
                            <div className="text-xs theme-muted flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6-6m-6 0l6 6"
                                  />
                                </svg>
                                <span className="text-xs">
                                  {new Date(
                                    member.joinedAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {member.hasVoted && (
                                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-success/20 text-success border border-success/30">
                                  <svg
                                    className="w-2.5 h-2.5 mr-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  Voted
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {member.user?.id !== booth.creator?.id ? (
                          <button
                            onClick={() => handleRemoveMember(member.user.id)}
                            disabled={removingMembers.has(member.user.id)}
                            className="text-error hover:text-error/90 hover:bg-error/10 disabled:opacity-50 transition-all duration-300 p-1.5 rounded-lg ml-2 flex-shrink-0 border border-transparent hover:border-error/30"
                            title="Remove member"
                          >
                            {removingMembers.has(member.user.id) ? (
                              <PageLoading size="sm" color="red" />
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-warning/20 text-warning ml-2 flex-shrink-0 border border-warning/30">
                            <svg
                              className="w-2.5 h-2.5 mr-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 3l14 9-14 9V3z"
                              />
                            </svg>
                            Admin
                          </span>
                        )}
                      </div>
                    ))}

                    {(!booth?.members || booth.members.length === 0) && (
                      <div className="text-center py-12 sm:py-16">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-10 h-10 sm:w-12 sm:h-12 theme-muted"
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
                        <p className="theme-text text-base sm:text-lg font-bold mb-2">
                          No members yet
                        </p>
                        <p className="theme-muted text-sm mb-4">
                          Share the invite code to get people to join
                        </p>
                        <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
                          <p className="text-primary text-xs font-medium">
                            💡 Tip: Use the invite code or link above to invite
                            members
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Danger Zone — Delete */}
                <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 dark:from-rose-950/40 dark:via-red-950/30 dark:to-orange-950/20 border border-rose-200 dark:border-rose-800/60 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-rose-300 dark:hover:border-rose-700">
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                        <svg
                          className="w-5 h-5 text-white"
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
                      <div>
                        <h3 className="text-base font-bold theme-text">
                          Danger Zone
                        </h3>
                        <p className="text-xs theme-muted">
                          Irreversible actions
                        </p>
                      </div>
                    </div>

                    {/* Delete row */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5 border border-rose-100 dark:border-rose-900/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold theme-text mb-0.5">
                          Delete booth
                        </p>
                        <p className="text-xs theme-muted leading-relaxed">
                          Permanently delete this booth. All members will lose
                          access and this action cannot be undone.
                        </p>
                      </div>
                      <button
                        id="delete-booth-btn"
                        onClick={handleDeleteBooth}
                        disabled={updating}
                        className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 dark:from-rose-600 dark:to-red-600 dark:hover:from-rose-700 dark:hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel || "Confirm"}
        requireText={confirm.requireText}
        loading={confirm.loading}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

      <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #94a3b8;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                }
            `}</style>

      {/* QR Code Modal */}
      {qrModalData && (
        <QRCodeModal
          data={qrModalData}
          onClose={() => setQrModalData(null)}
          onDownload={downloadQRCode}
        />
      )}
    </div>
  );
};

// Small inline add-candidate component
const AddCandidateInline = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await onAdd({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      setOpen(false);
    } catch (err) {
      // onAdd should surface errors via toasts
    } finally {
      setAdding(false);
    }
  };

  if (!open) {
    return (
      <div className="flex">
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="sm"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
          iconPosition="left"
        >
          Add candidate
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Candidate name"
        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm theme-surface theme-text focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm theme-surface theme-text focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="flex items-center gap-2">
        <Button
          onClick={submit}
          disabled={adding || !name.trim()}
          variant="primary"
          size="sm"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
          iconPosition="left"
        >
          {adding ? "Adding..." : "Add"}
        </Button>
        <Button
          onClick={() => {
            setOpen(false);
            setName("");
            setDescription("");
          }}
          variant="ghost"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default BoothAdminPage;
