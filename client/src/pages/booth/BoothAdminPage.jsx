import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { boothService } from "../../services/api";
import { Alert } from "../../components/layout/Alert";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";
import { useToast } from "../../components/layout/Toast";
import ConfirmModal from "../../components/layout/ConfirmModal";
import Button from "../../components/layout/Button";
import BackButton from "../../components/layout/BackButton";
import Toggle from "../../components/layout/Toggle";
import AppWatermark from "../../components/layout/AuthWatermarkBackground";
import { shareBooth } from "../../services/shareService";
import PullToRefresh from "../../components/layout/PullToRefresh";
import { useRegisterModal } from "../../hooks/useRegisterModal";
const QRCodeModal = lazy(() =>
  import("../../components/booth/QRCodeModal").then((m) => ({
    default: m.QRCodeModal || m.default,
  }))
);

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

  // Mobile specific state for 6-screen mockup
  const [mobileTab, setMobileTab] = useState("overview"); // "overview" | "members" | "candidates" | "settings"
  const [mobileSearchMembers, setMobileSearchMembers] = useState("");
  const [mobileSearchActivity, setMobileSearchActivity] = useState("");
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCloseBoothModal, setShowCloseBoothModal] = useState(false);
  const [showReopenBoothModal, setShowReopenBoothModal] = useState(false);
  const [showResetInviteModal, setShowResetInviteModal] = useState(false);
  const [showDeleteBoothModal, setShowDeleteBoothModal] = useState(false);
  const [candidateModal, setCandidateModal] = useState({
    open: false,
    mode: "add",
    index: -1,
    name: "",
    description: "",
    saving: false,
  });
  const [memberActionModal, setMemberActionModal] = useState({
    open: false,
    member: null,
  });

  useRegisterModal(Boolean(qrModalData), () => setQrModalData(null));
  useRegisterModal(showMenuDropdown, () => setShowMenuDropdown(false));
  useRegisterModal(showShareModal, () => setShowShareModal(false));
  useRegisterModal(showCloseBoothModal, () => setShowCloseBoothModal(false));
  useRegisterModal(showReopenBoothModal, () => setShowReopenBoothModal(false));
  useRegisterModal(showResetInviteModal, () => setShowResetInviteModal(false));
  useRegisterModal(showDeleteBoothModal, () => setShowDeleteBoothModal(false));
  useRegisterModal(candidateModal.open, () => setCandidateModal((prev) => ({ ...prev, open: false })));
  useRegisterModal(memberActionModal.open, () => setMemberActionModal({ open: false, member: null }));

  const handleSaveCandidate = async ({ name, description }) => {
    try {
      setCandidateModal((prev) => ({ ...prev, saving: true }));
      let updatedCandidates = [];
      if (candidateModal.mode === "edit") {
        updatedCandidates = (booth?.candidates || []).map((c, i) =>
          i === candidateModal.index ? { ...c, name, description } : c
        );
      } else {
        updatedCandidates = [
          ...(booth?.candidates || []),
          { name, description, voteCount: 0 },
        ];
      }

      const response = await boothService.updateBooth(boothId, {
        candidates: updatedCandidates,
      });

      if (response && response.success) {
        addToast(
          candidateModal.mode === "edit"
            ? "Candidate updated successfully"
            : "Candidate added successfully",
          "success"
        );
        setCandidateModal({
          open: false,
          mode: "add",
          index: -1,
          name: "",
          description: "",
          saving: false,
        });
        await fetchBoothDetails();
      } else {
        addToast(response?.error || "Failed to update candidate", "error");
        setCandidateModal((prev) => ({ ...prev, saving: false }));
      }
    } catch (err) {
      addToast(err.message || "Failed to save candidate", "error");
      setCandidateModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleConfirmReopenBooth = async () => {
    try {
      setUpdating(true);
      const srvSettings = booth?.settings || {};
      try {
        await boothService.updateSettings(boothId, {
          ...srvSettings,
          scheduled: false,
          votingStartTime: null,
          votingEndTime: null,
        });
      } catch (settingsErr) {
        console.warn("Failed to clear settings before reopen:", settingsErr);
      }

      const response = await boothService.toggleStatus(boothId);
      if (response && (response.success || response.status === "active")) {
        setShowReopenBoothModal(false);
        setSettings((prev) => ({
          ...prev,
          scheduled: false,
          votingStartTime: null,
          votingEndTime: null,
        }));
        setCountdownText(null);
        await fetchBoothDetails();
        addToast("Booth reopened successfully", "success");
      } else {
        addToast(response?.error || "Failed to reopen booth", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to reopen booth", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmCloseBooth = async () => {
    try {
      setUpdating(true);
      const response = await boothService.toggleStatus(boothId);
      if (response.success) {
        setShowCloseBoothModal(false);
        await fetchBoothDetails();
        addToast("Booth closed successfully", "success");
      } else {
        addToast(response.error || "Failed to close booth", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to close booth", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmResetInvite = async () => {
    try {
      setUpdating(true);
      const response = await boothService.resetInviteCode(boothId);
      if (response && response.success) {
        setShowResetInviteModal(false);
        await fetchBoothDetails();
        addToast("Invite code reset successfully", "success");
      } else {
        addToast(response?.error || "Failed to reset invite code", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to reset invite code", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDeleteBooth = async () => {
    try {
      setUpdating(true);
      const response = await boothService.deleteBooth(boothId);
      if (response.success) {
        setShowDeleteBoothModal(false);
        addToast("Booth deleted successfully", "success");
        navigate("/dashboard");
      } else {
        addToast(response.error || "Failed to delete booth", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to delete booth", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMemberFromModal = async (memberId) => {
    try {
      setRemovingMembers((prev) => new Set(prev).add(memberId));
      const response = await boothService.removeMember(boothId, memberId);
      if (response.success) {
        setMemberActionModal({ open: false, member: null });
        await fetchBoothDetails();
        addToast("Member removed successfully", "success");
      } else {
        addToast(response.error || "Failed to remove member", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to remove member", "error");
    } finally {
      setRemovingMembers((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  // Activity tab state
  const [activeTab, setActiveTab] = useState("overview");
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");
  const [activitiesFetched, setActivitiesFetched] = useState(false);

  useEffect(() => {
    fetchBoothDetails();
    fetchActivity();
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
        const hasSchedule = Boolean(srvSettings.scheduled || srvSettings.votingStartTime || srvSettings.votingEndTime);
        setSettings({
          ...srvSettings,
          votingStartTime: toDatetimeLocal(srvSettings.votingStartTime),
          votingEndTime: toDatetimeLocal(srvSettings.votingEndTime),
          restrictByEmailDomain:
            Array.isArray(srvSettings.allowedEmailDomains) &&
            srvSettings.allowedEmailDomains.length > 0,
          scheduled: hasSchedule,
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

      const payload = { ...settings };
      if (settings.scheduled === true) {
        payload.votingStartTime = settings.votingStartTime || booth?.settings?.votingStartTime || null;
        payload.votingEndTime = settings.votingEndTime || booth?.settings?.votingEndTime || null;
      } else if (settings.scheduled === false) {
        payload.votingStartTime = null;
        payload.votingEndTime = null;
      }

      const response = await boothService.updateSettings(boothId, payload);

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

  const isScheduleExpired = () => {
    if (countdownText === "Voting ended") return true;
    const endTime = settings?.votingEndTime || booth?.settings?.votingEndTime;
    if (endTime) {
        const end = new Date(endTime);
      if (!isNaN(end.getTime()) && new Date() >= end) {
        return true;
      }
    }
    return false;
  };

  const handleToggleStatus = async () => {
    // 1. If currently active, prompt danger zone bottom sheet to confirm closing
    if (booth?.status === "active") {
      setShowCloseBoothModal(true);
      return;
    }

    // 2. If currently closed and schedule is expired, show friendly Reopen Voting drawer
    if (isScheduleExpired()) {
      setShowReopenBoothModal(true);
      return;
    }

    // 3. If closed and schedule is not expired, activate directly
    try {
      setUpdating(true);
      const response = await boothService.toggleStatus(boothId);
      if (response && (response.success || response.status === "active")) {
        await fetchBoothDetails();
        addToast("Booth activated", "success");
      } else {
        addToast(response?.error || "Failed to activate booth", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to activate booth", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleResetInviteCode = () => {
    setShowResetInviteModal(true);
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

  const handleDeleteBooth = () => {
    setShowDeleteBoothModal(true);
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
          addToast(err.message || "Failed to toggle status", "error");
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
    } catch {
      addToast("Failed to copy to clipboard", "error");
    }
  };

  const handleShareInvite = async () => {
    if (!booth || !booth.inviteCode) return;
    try {
      const res = await shareBooth({
        boothName: booth.name,
        inviteCode: booth.inviteCode,
        inviteLink: `${window.location.origin}/join/${booth.inviteCode}`,
      });
      if (res?.method === "clipboard") {
        addToast("Invite link copied to clipboard", "success");
      }
    } catch (err) {
      console.warn("Share failed, falling back to copy:", err);
      await copyToClipboard(
        `${window.location.origin}/join/${booth.inviteCode}`,
        "Invite link copied to clipboard"
      );
    }
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

  const renderDesktopAdmin = () => (
    <div className="py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-1 animate-fadeIn">
          {/* Title and Status Toggle Row */}
          <div className="flex items-start justify-center pt-1 sm:pt-2 mb-2 relative">
            <div className="text-center max-w-4xl mx-auto px-4 sm:px-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 break-words"></h1>
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

                <div className="flex justify-end">
                  <Toggle
                    checked={booth?.status === "active"}
                    onChange={handleToggleStatus}
                    disabled={updating}
                    ariaLabel="Toggle booth status"
                    size="md"
                  />
                </div>

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
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20">
                DOMAIN RESTRICTED
              </span>
            ) : null}

            {settings.scheduled &&
              (settings.votingStartTime || settings.votingEndTime) && (
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-transparent text-sky-600 dark:text-sky-400 border border-sky-500/50">
                  SCHEDULED
                </span>
              )}
            {countdownText && (
              <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold bg-transparent text-red-600 dark:text-red-400 border border-red-500/60 dark:border-red-500/50 flex items-center gap-1.5 animate-pulse">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
          {/* Tab Bar: separated pills */}
          <div
            className="flex items-center gap-2.5 w-fit mx-auto animate-fadeIn mb-4"
            style={{ "--stagger-index": 4 }}
          >
            <button
              onClick={() => handleTabChange("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === "overview"
                  ? "btn-theme text-on-primary shadow-sm"
                  : "theme-surface border border-border theme-muted hover:theme-text shadow-2xs"
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  activeTab === "overview" ? "text-on-primary" : "text-accent"
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === "activity"
                  ? "btn-theme text-on-primary shadow-sm"
                  : "theme-surface border border-border theme-muted hover:theme-text shadow-2xs"
              }`}
            >
              <svg
                className={`w-4 h-4 ${
                  activeTab === "activity" ? "text-on-primary" : "text-accent"
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
                                  handleSettingChange("votingStartTime", null);
                                  handleSettingChange("votingEndTime", null);
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
                              key={
                                candidate._id ||
                                candidate.id ||
                                candidate.name + idx
                              }
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
                                    throw new Error(
                                      response?.error ||
                                        "Failed to save candidates",
                                    );
                                  }
                                } catch (err) {
                                  addToast(
                                    err.message || "Failed to save candidates",
                                    "error",
                                  );
                                  await fetchBoothDetails();
                                  throw err;
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
                                  (req.user &&
                                    (req.user._id ||
                                      req.user.id ||
                                      req.user)) ||
                                  req._id ||
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
                        key={member._id || member.id}
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
    </div>
  );

  // ── MOBILE ADMIN SCREEN (Screens 1 to 6 from mockup) ────────────────────
  const renderMobileAdmin = () => {
    const filteredMembers = (booth?.members || []).filter((m) => {
      if (!mobileSearchMembers.trim()) return true;
      const q = mobileSearchMembers.toLowerCase();
      return (
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q)
      );
    });

    const formatActivityDate = (dateString) => {
      if (!dateString) return "";
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    // Full activity list for "See all" page with search
    const allActivities = activities && activities.length > 0 ? activities : [
      { id: 'created', message: 'Booth created', createdAt: booth?.createdAt },
      ...(booth?.members || []).map((m, i) => ({
        id: `member-${i}`,
        message: `${m.user?.name || 'Member'} joined the booth`,
        createdAt: m.joinedAt
      }))
    ];

    const filteredActivities = allActivities.filter((act) => {
      if (!mobileSearchActivity.trim()) return true;
      return act.message?.toLowerCase().includes(mobileSearchActivity.toLowerCase());
    });

    return (
      <div className="pb-28 sm:pb-12 w-full max-w-full overflow-x-hidden">
        {/* Top App Bar: Back Button & Title Consistent with other pages, NO horizontal line */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 w-full max-w-full">
          <div className="flex items-center gap-3">
            <BackButton fallback="/dashboard" />
            <h1 className="text-xl font-bold theme-text">Manage Booth</h1>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenuDropdown((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border theme-surface theme-text shadow-sm transition-colors hover:border-accent hover:bg-accent-50"
              aria-label="Booth options"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenuDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenuDropdown(false)} />
                <div className="absolute right-0 mt-1 w-48 rounded-2xl theme-surface border border-border shadow-xl py-1.5 z-50 animate-fadeIn">
                  <button
                    onClick={() => { setShowMenuDropdown(false); navigate(`/booth/${boothId}`); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium theme-text hover:bg-accent-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View as Voter
                  </button>
                  <button
                    onClick={() => { setShowMenuDropdown(false); navigate(`/booth/${boothId}/results`); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium theme-text hover:bg-accent-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    View Results
                  </button>
                  <button
                    onClick={() => { setShowMenuDropdown(false); setShowShareModal(true); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium theme-text hover:bg-accent-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share Booth
                  </button>
                  <button
                    onClick={() => { setShowMenuDropdown(false); handleResetInviteCode(); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium theme-text hover:bg-accent-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Reset Invite Code
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => { setShowMenuDropdown(false); setShowDeleteBoothModal(true); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-error hover:bg-error/10 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Booth
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Booth Header Card: consistent box around name, boothId, status, creator, countdown and toggle */}
        <div className="px-4 pt-2 mb-3 w-full max-w-full">
          <div className="theme-surface rounded-2xl border border-border p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h2 className="text-base font-bold theme-text truncate">{booth?.name}</h2>
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span
                      className={`text-[11px] font-bold tracking-wide uppercase mb-1 transition-colors ${
                        booth?.status === "active" ? "text-success" : "text-error"
                      }`}
                    >
                      {booth?.status === "active" ? "Active" : "Closed"}
                    </span>
                    <Toggle
                      checked={booth?.status === "active"}
                      onChange={handleToggleStatus}
                      disabled={updating}
                      ariaLabel="Toggle booth active status"
                      size="sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs theme-muted mb-1.5">
                  <span className="truncate">Booth ID: {booth?.boothId}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(booth?.boothId, "Booth ID copied")}
                    className="p-1 -m-0.5 hover:text-accent shrink-0"
                    title="Copy Booth ID"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Creator
                  </span>
                  {countdownText && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-transparent text-red-600 dark:text-red-400 border border-red-500/60 dark:border-red-500/50">
                      <svg className="w-3 h-3 animate-pulse text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {countdownText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Tab Bar: 4-column responsive grid matching user image media_1793114419171_d79482e9.png */}
        <div className="px-4 py-2 w-full max-w-full">
          <div className="grid grid-cols-4 gap-1.5 w-full">
            {[
              { id: "overview", label: "Overview" },
              { id: "members", label: "Members" },
              { id: "candidates", label: "Candidates" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={`py-2 px-1 text-center rounded-full text-xs font-semibold truncate transition-all duration-150 ${
                  mobileTab === tab.id
                    ? "btn-theme text-on-primary shadow-sm"
                    : "border border-border theme-surface theme-muted hover:theme-text shadow-2xs"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: OVERVIEW SCREEN */}
        {mobileTab === "overview" && (
          <div className="animate-fadeIn w-full max-w-full">
            {/* 3 Stat Cards in a row */}
            <div className="grid grid-cols-3 gap-2.5 px-4 my-2 w-full">
              <div className="theme-surface rounded-2xl border border-border p-3 text-center">
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div className="text-xl font-bold theme-text">{booth?.totalVotes || 0}</div>
                <div className="text-[11px] theme-muted mt-0.5">Total Votes</div>
              </div>

              <div className="theme-surface rounded-2xl border border-border p-3 text-center">
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="text-xl font-bold theme-text">{booth?.members?.length || 0}</div>
                <div className="text-[11px] theme-muted mt-0.5">Members</div>
              </div>

              <div className="theme-surface rounded-2xl border border-border p-3 text-center">
                <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div className="text-xl font-bold theme-text">{booth?.candidates?.length || 0}</div>
                <div className="text-[11px] theme-muted mt-0.5">Candidates</div>
              </div>
            </div>

            {/* 3) VOTER INVITE CODE CARD (Matching Booth Card style) */}
            <div className="mx-4 mt-3 theme-surface rounded-2xl border border-border p-4 shadow-sm w-[calc(100%-2rem)] max-w-full">
              {/* Header with Title, Description, and Reset Code Button */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold theme-text text-sm leading-tight">Voter Invite Code</h3>
                    <p className="text-[11px] theme-muted mt-0.5">Share with voters to let them join this private booth</p>
                  </div>
                </div>

                {/* Reset Code Button directly on the card */}
                <button
                  type="button"
                  onClick={handleResetInviteCode}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border text-[11px] font-semibold theme-muted hover:text-warning hover:border-warning/40 hover:bg-warning/10 transition-colors shrink-0 active:scale-95"
                  title="Generate a new invite code"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset</span>
                </button>
              </div>

              {/* Invite Code Box matching Booth Card */}
              <div className="rounded-xl px-3 py-2.5 border border-border bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg border border-accent/20 bg-accent-50 text-accent dark:bg-accent/15 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs theme-muted">Invite code</span>
                  <span className="text-xs sm:text-sm font-bold font-mono theme-text tracking-wider">{booth?.inviteCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(booth?.inviteCode, "Invite code copied")}
                  className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-accent hover:bg-accent-50 dark:hover:bg-accent/10 transition-colors"
                  title="Copy invite code"
                  aria-label="Copy invite code"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              {/* Clean Quick Actions: Share Link & Show QR Code */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShareInvite}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-border text-xs font-semibold theme-surface theme-text hover:bg-accent-50 hover:border-accent/40 active:scale-95 transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Link
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-border text-xs font-semibold theme-surface theme-text hover:bg-accent-50 hover:border-accent/40 active:scale-95 transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  QR Code
                </button>
              </div>
            </div>

            {/* Recent Activity Section with See All */}
            <div className="mx-4 mt-4 mb-4 w-[calc(100%-2rem)] max-w-full">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-bold theme-text">Recent Activity</h3>
                <button
                  type="button"
                  onClick={() => {
                    fetchActivity();
                    setMobileTab("activity");
                  }}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  See all
                </button>
              </div>
              <div className="space-y-2">
                {activities && activities.length > 0 ? (
                  activities.slice(0, 3).map((act, i) => (
                    <div key={act.id || i} className="flex items-center gap-3 p-3 rounded-2xl border border-border theme-surface">
                      <div className="w-8 h-8 rounded-full bg-accent-50 text-accent flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold theme-text truncate">{act.message}</div>
                        <div className="text-[11px] theme-muted mt-0.5">{formatActivityDate(act.createdAt)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-border theme-surface">
                      <div className="w-8 h-8 rounded-full bg-accent-50 text-accent flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold theme-text truncate">Booth created</div>
                        <div className="text-[11px] theme-muted mt-0.5">{formatActivityDate(booth?.createdAt)}</div>
                      </div>
                    </div>
                    {booth?.members && booth.members.length > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl border border-border theme-surface">
                        <div className="w-8 h-8 rounded-full bg-accent-50 text-accent flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold theme-text truncate">
                            {booth.members[booth.members.length - 1]?.user?.name || "Member"} joined
                          </div>
                          <div className="text-[11px] theme-muted mt-0.5">
                            {formatActivityDate(booth.members[booth.members.length - 1]?.joinedAt)}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FULL ACTIVITY SCREEN */}
        {mobileTab === "activity" && (
          <div className="animate-fadeIn w-full max-w-full px-4">
            <div className="flex items-center justify-between pt-1 pb-3">
              <button
                type="button"
                onClick={() => setMobileTab("overview")}
                className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Overview
              </button>
              <button
                type="button"
                onClick={fetchActivity}
                disabled={activitiesLoading}
                className="flex items-center gap-1 text-xs font-semibold theme-muted hover:theme-text disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${activitiesLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            <div className="relative mb-3 w-full">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search activities..."
                value={mobileSearchActivity}
                onChange={(e) => setMobileSearchActivity(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-border theme-surface theme-text text-xs focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {mobileSearchActivity && (
                <button
                  type="button"
                  onClick={() => setMobileSearchActivity("")}
                  className="absolute inset-y-0 right-2.5 flex items-center text-muted hover:theme-text"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="theme-surface rounded-2xl border border-border p-4 shadow-xs">
              <h3 className="text-sm font-bold theme-text mb-3">Activity Timeline</h3>

              {activitiesLoading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 items-start animate-pulse">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent/30 mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-accent/10 rounded w-3/4" />
                        <div className="h-2 bg-accent/10 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActivities.length > 0 ? (
                <ol className="relative border-l-2 border-accent/20 ml-2 space-y-4 py-1">
                  {filteredActivities.map((act, idx) => (
                    <li key={act.id || idx} className="ml-4 relative">
                      <span className="absolute -left-[23px] top-1 flex items-center justify-center w-3 h-3 rounded-full bg-accent/30 border-2 border-accent" />
                      <p className="text-xs font-semibold theme-text leading-snug">
                        {act.message}
                      </p>
                      <time className="text-[10px] theme-muted mt-0.5 block">
                        {formatActivityDate(act.createdAt)} ({formatRelativeTime(act.createdAt)})
                      </time>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs theme-muted">No activity matching your search</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEMBERS SCREEN */}
        {mobileTab === "members" && (
          <div className="animate-fadeIn w-full max-w-full">
            <div className="px-4 pt-1 pb-3 flex items-center gap-2 w-full">
              <div className="relative flex-1 min-w-0">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search members..."
                  value={mobileSearchMembers}
                  onChange={(e) => setMobileSearchMembers(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-border theme-surface theme-text text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {mobileSearchMembers && (
                  <button
                    type="button"
                    onClick={() => setMobileSearchMembers("")}
                    className="absolute inset-y-0 right-2.5 flex items-center text-muted hover:theme-text"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl btn-theme text-on-primary text-xs font-semibold shadow-sm shrink-0 whitespace-nowrap active:scale-95 transition-transform"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Member
              </button>
            </div>

            {/* PENDING APPROVAL REQUESTS */}
            {booth?.pendingRequests && booth.pendingRequests.length > 0 && (
              <div className="mx-4 mb-4 p-3.5 rounded-2xl border border-warning/30 bg-warning/10 w-[calc(100%-2rem)] max-w-full">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  <span className="text-xs font-bold text-warning uppercase tracking-wider">
                    Pending Requests ({booth.pendingRequests.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {booth.pendingRequests.map((req) => {
                    const userId = req.user?.id || req.user?._id || req.user;
                    const isActionLoading = pendingActionLoading.has(userId);
                    return (
                      <div key={userId} className="flex items-center justify-between p-2.5 rounded-xl border border-border theme-surface shadow-xs min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
                          <div className="w-9 h-9 rounded-full bg-warning/20 text-warning font-bold text-xs flex items-center justify-center shrink-0">
                            {req.user?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold theme-text truncate">{req.user?.name || "Unknown User"}</div>
                            <div className="text-[11px] theme-muted truncate">{req.user?.email || ""}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(userId)}
                            disabled={isActionLoading}
                            className="px-2.5 py-1 bg-success text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-transform shadow-xs"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(userId)}
                            disabled={isActionLoading}
                            className="px-2.5 py-1 bg-error text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-transform shadow-xs"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Members List Header & Cards */}
            <div className="px-4 w-full max-w-full">
              <div className="text-sm font-bold theme-text mb-2.5">
                Members ({filteredMembers.length})
              </div>

              {filteredMembers.length > 0 ? (
                <div className="space-y-2.5 mb-6">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.user?.id || member._id || member.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-border theme-surface shadow-xs min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2 flex-1">
                        <div className="w-10 h-10 rounded-full bg-accent-50 text-accent border border-accent/20 font-bold text-sm flex items-center justify-center shrink-0">
                          {member.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold theme-text truncate">
                            {member.user?.name || "User"}
                          </div>
                          <div className="text-[11px] theme-muted mt-0.5">
                            Joined {new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {member.hasVoted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20">
                            <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Voted
                          </span>
                        )}
                        {member.user?.id === booth?.creator?.id || member.user?.id === booth?.creator ? (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                            Creator
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMemberActionModal({ open: true, member })}
                            disabled={removingMembers.has(member.user?.id || member.user?._id)}
                            className="p-1.5 rounded-xl text-error bg-error/10 hover:bg-error/20 border border-error/30 transition-all active:scale-95 disabled:opacity-50"
                            aria-label="Delete member"
                            title="Delete member"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center theme-surface rounded-2xl border border-border">
                  <p className="text-xs theme-muted">No members found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CANDIDATES SCREEN */}
        {mobileTab === "candidates" && (
          <div className="animate-fadeIn w-full max-w-full">
            <div className="px-4 pt-1">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold theme-text">
                  Candidates ({booth?.candidates?.length || 0})
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (booth?.totalVotes > 0) {
                      addToast("Candidate editing is locked — votes already exist", "warning");
                      return;
                    }
                    setCandidateModal({ open: true, mode: "add", index: -1, name: "", description: "" });
                  }}
                  disabled={booth?.totalVotes > 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full btn-theme text-on-primary disabled:opacity-50 text-xs font-semibold shadow-sm active:scale-95 transition-transform"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Candidate
                </button>
              </div>

              {booth?.totalVotes > 0 && (
                <div className="mb-3 p-2.5 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning">
                  Candidate editing locked ({booth.totalVotes} votes recorded).
                </div>
              )}

              <div className="space-y-2.5 mb-6">
                {(booth?.candidates || []).map((candidate, idx) => (
                  <div
                    key={candidate._id || candidate.id || idx}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border theme-surface shadow-xs min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2 flex-1">
                      <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary border border-secondary/20 font-bold text-sm flex items-center justify-center shrink-0">
                        {candidate.name?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold theme-text truncate">{candidate.name}</div>
                        <div className="text-[11px] theme-muted truncate mt-0.5">{candidate.description || "Candidate"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (booth?.totalVotes > 0) {
                            addToast("Candidate editing is locked — votes already exist", "warning");
                            return;
                          }
                          setCandidateModal({
                            open: true,
                            mode: "edit",
                            index: idx,
                            name: candidate.name,
                            description: candidate.description || "",
                          });
                        }}
                        disabled={booth?.totalVotes > 0}
                        className="p-1.5 rounded-lg text-accent hover:bg-accent-50 disabled:opacity-40"
                        title="Edit candidate"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (booth?.totalVotes > 0) {
                            addToast("Candidate editing is locked — votes already exist", "warning");
                            return;
                          }
                          if ((booth?.candidates?.length || 0) <= 2) {
                            addToast("Cannot delete - minimum 2 candidates required", "warning");
                            return;
                          }
                          setConfirm({
                            open: true,
                            action: "removeCandidate",
                            payload: { index: idx },
                            title: "Remove candidate",
                            description: `Remove candidate "${candidate.name}"? This cannot be undone.`,
                          });
                        }}
                        disabled={booth?.totalVotes > 0 || (booth?.candidates?.length || 0) <= 2}
                        className="p-1.5 rounded-lg text-error hover:bg-error/10 disabled:opacity-40"
                        title="Delete candidate"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS SCREEN (Using Toggle component & standard single toast) */}
        {mobileTab === "settings" && (
          <div className="animate-fadeIn w-full max-w-full">
            <div className="px-4 pt-1">
              <div className="text-sm font-bold theme-text mb-3">Voting Settings</div>

              <div className="space-y-3 mb-6">
                {/* 1. Show live results */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border theme-surface">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold theme-text">Show live results</div>
                      <div className="text-[11px] theme-muted mt-0.5">Allow voters to see results in real-time</div>
                    </div>
                  </div>
                  <Toggle
                    checked={Boolean(settings.showLiveResults)}
                    onChange={(val) => handleSettingChange("showLiveResults", val)}
                    ariaLabel="Toggle live results"
                    size="md"
                  />
                </div>

                {/* 2. Allow results after voting ends */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border theme-surface">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold theme-text">Allow results after voting ends</div>
                      <div className="text-[11px] theme-muted mt-0.5">Make results visible after the end date</div>
                    </div>
                  </div>
                  <Toggle
                    checked={Boolean(settings.resultsVisibleToVoters)}
                    onChange={(val) => handleSettingChange("resultsVisibleToVoters", val)}
                    ariaLabel="Toggle results visibility after voting ends"
                    size="md"
                  />
                </div>

                {/* 3. Require approval */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border theme-surface">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold theme-text">Require approval</div>
                      <div className="text-[11px] theme-muted mt-0.5">Manually approve new members</div>
                    </div>
                  </div>
                  <Toggle
                    checked={Boolean(settings.requireApproval)}
                    onChange={(val) => handleSettingChange("requireApproval", val)}
                    ariaLabel="Toggle member approval requirement"
                    size="md"
                  />
                </div>

                {/* 4. Restrict by email domain */}
                <div className="p-3.5 rounded-2xl border border-border theme-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold theme-text">Restrict by email domain</div>
                        <div className="text-[11px] theme-muted mt-0.5">Only allow specific email domains</div>
                      </div>
                    </div>
                    <Toggle
                      checked={Boolean(settings.restrictByEmailDomain)}
                      onChange={(val) => {
                        handleSettingChange("restrictByEmailDomain", val);
                        if (!val) handleSettingChange("allowedEmailDomains", []);
                      }}
                      ariaLabel="Toggle email domain restriction"
                      size="md"
                    />
                  </div>
                  {settings.restrictByEmailDomain && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <label className="block text-[11px] font-semibold theme-text mb-1">Allowed Domains (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. university.edu, company.com"
                        value={Array.isArray(settings.allowedEmailDomains) ? settings.allowedEmailDomains.join(", ") : ""}
                        onChange={(e) =>
                          handleSettingChange(
                            "allowedEmailDomains",
                            e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        className="w-full px-3 py-1.5 rounded-xl border border-border theme-surface theme-text text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  )}
                </div>

                {/* 5. Scheduled voting */}
                <div className="p-3.5 rounded-2xl border border-border theme-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold theme-text">Scheduled voting</div>
                        <div className="text-[11px] theme-muted mt-0.5">Set start and end time</div>
                      </div>
                    </div>
                    <Toggle
                      checked={Boolean(settings.scheduled)}
                      onChange={(val) => {
                        handleSettingChange("scheduled", val);
                        if (!val) {
                          handleSettingChange("votingStartTime", null);
                          handleSettingChange("votingEndTime", null);
                        }
                      }}
                      ariaLabel="Toggle scheduled voting"
                      size="md"
                    />
                  </div>
                  {settings.scheduled && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold theme-text mb-1">Start Time</label>
                        <input
                          type="datetime-local"
                          value={settings.votingStartTime || ""}
                          onChange={(e) => handleSettingChange("votingStartTime", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-border theme-surface theme-text text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold theme-text mb-1">End Time</label>
                        <input
                          type="datetime-local"
                          value={settings.votingEndTime || ""}
                          onChange={(e) => handleSettingChange("votingEndTime", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-border theme-surface theme-text text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Settings Button - only triggers standard global toast */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleUpdateSettings}
                    disabled={updating}
                    className="w-full py-3 rounded-2xl btn-theme text-on-primary font-semibold text-xs shadow-md disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    {updating ? "Saving..." : "Save Settings"}
                  </button>
                </div>

                {/* Danger Zone: Delete Booth */}
                <div className="pt-4 border-t border-border mt-6">
                  <div className="text-xs font-bold text-error uppercase tracking-wider mb-2">Danger Zone</div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteBoothModal(true)}
                    disabled={updating}
                    className="w-full py-3 rounded-2xl border border-error/30 text-error hover:bg-error/10 font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Booth Permanently
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="min-h-screen theme-bg relative overflow-hidden">
      <AppWatermark variant="shield" />
      {/* ── MOBILE ADMIN VIEW (md:hidden) ── */}
      <div className="md:hidden relative z-10">
        <PullToRefresh onRefresh={fetchBoothDetails}>
          {renderMobileAdmin()}
        </PullToRefresh>
      </div>

      {/* ── DESKTOP ADMIN VIEW (hidden md:block) ── */}
      <div className="hidden md:block relative z-10">
        {renderDesktopAdmin()}
      </div>

      <ConfirmModal
        isOpen={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel || "Confirm"}
        variant={confirm.variant || "danger"}
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

      {/* SCREEN 5: Share & QR Bottom Sheet */}
      <MobileShareBottomSheet
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        booth={booth}
        onShare={handleShareInvite}
      />

      {/* Friendly Reopen Booth Drawer */}
      <MobileReopenBoothBottomSheet
        isOpen={showReopenBoothModal}
        onClose={() => setShowReopenBoothModal(false)}
        onConfirm={handleConfirmReopenBooth}
        loading={updating}
      />

      {/* SCREEN 6: Danger Zone Confirmation (Close Booth Bottom Sheet) */}
      <MobileCloseBoothBottomSheet
        isOpen={showCloseBoothModal}
        onClose={() => setShowCloseBoothModal(false)}
        onConfirm={handleConfirmCloseBooth}
        loading={updating}
      />

      {/* Delete Booth Bottom Sheet */}
      {/* Reset Invite Code Bottom Sheet */}
      <MobileResetInviteBottomSheet
        isOpen={showResetInviteModal}
        onClose={() => setShowResetInviteModal(false)}
        onConfirm={handleConfirmResetInvite}
        loading={updating}
        currentCode={booth?.inviteCode}
      />

      {/* Delete Booth Bottom Sheet */}
      <MobileDeleteBoothBottomSheet
        isOpen={showDeleteBoothModal}
        onClose={() => setShowDeleteBoothModal(false)}
        onConfirm={handleConfirmDeleteBooth}
        loading={updating}
        boothName={booth?.name}
      />

      {/* Candidate Add / Edit Bottom Sheet */}
      <MobileCandidateModal
        isOpen={candidateModal.open}
        onClose={() => setCandidateModal((prev) => ({ ...prev, open: false }))}
        onSave={handleSaveCandidate}
        mode={candidateModal.mode}
        initialData={candidateModal}
        saving={candidateModal.saving}
      />

      {/* Member Action Bottom Sheet */}
      <MobileMemberActionBottomSheet
        isOpen={memberActionModal.open}
        onClose={() => setMemberActionModal({ open: false, member: null })}
        member={memberActionModal.member}
        onRemove={handleRemoveMemberFromModal}
        isRemoving={removingMembers.has(memberActionModal.member?.user?.id)}
      />
    </div>
  );
};

// ── Mobile Bottom Sheet Sub-Components ──────────────────────────────────────

const MobileShareBottomSheet = ({ isOpen, onClose, booth, onShare }) => {
  const canvasRef = useRef(null);
  const inviteLink = `${window.location.origin}/booth/join/${booth?.inviteCode}`;
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current && booth?.inviteCode) {
      import("qrcode")
        .then(({ default: QRCode }) => {
          QRCode.toCanvas(
            canvasRef.current,
            inviteLink,
            {
              width: 160,
              margin: 1,
              color: { dark: "#000000", light: "#ffffff" },
              errorCorrectionLevel: "H",
            },
            (err) => {
              if (err) console.error("QR render error:", err);
            }
          );
        })
        .catch(console.error);
    }
  }, [isOpen, inviteLink, booth?.inviteCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-lg theme-surface rounded-t-3xl p-6 pb-28 sm:pb-8 shadow-2xl border-t border-border animate-slideUp max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-6" />
          <h3 className="text-base font-bold theme-text">Share Booth</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-muted hover:theme-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* QR Canvas */}
        <div className="flex justify-center mb-3">
          <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
            <canvas ref={canvasRef} id="mobile-qr-canvas" className="rounded-lg" />
          </div>
        </div>

        {/* Booth Name */}
        <div className="text-center font-bold theme-text text-base mb-3 truncate">
          {booth?.name}
        </div>

        {/* URL Box */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border bg-black/5 dark:bg-white/5 mb-4 min-w-0">
          <span className="font-mono text-xs theme-muted truncate pr-2 min-w-0 flex-1">
            {inviteLink}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="p-1 hover:text-accent shrink-0 text-muted"
            title="Copy Link"
          >
            {copiedLink ? (
              <span className="text-xs font-semibold text-success">Copied!</span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
          </button>
        </div>

        {/* 3 Buttons Row */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-border text-xs font-semibold theme-surface theme-text hover:bg-accent-50 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Copy Link
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-border text-xs font-semibold theme-surface theme-text hover:bg-accent-50 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v.01M12 12v.01M20 12v.01M4 12a8 8 0 0116 0M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8" /></svg>
            Share
          </button>
          <button
            type="button"
            onClick={() => {
              const canvas = canvasRef.current || document.getElementById("mobile-qr-canvas");
              if (canvas) {
                const url = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.download = `${(booth?.name || "booth").replace(/\s+/g, "-")}-QR.png`;
                link.href = url;
                link.click();
              }
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl btn-theme text-on-primary text-xs font-semibold shadow-sm active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
};


const MobileReopenBoothBottomSheet = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-lg theme-surface rounded-t-3xl p-6 pb-28 sm:pb-8 shadow-2xl border-t border-border animate-slideUp text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="w-6" />
          <h3 className="text-base font-bold theme-text">Reopen Voting</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-muted hover:theme-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Friendly Clock / Refresh Icon in App Accent Colors */}
        <div className="w-16 h-16 rounded-full bg-accent-50 text-accent border border-accent/20 flex items-center justify-center mx-auto my-4 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h4 className="text-lg font-bold theme-text mb-2">Voting period ended</h4>
        <p className="text-xs sm:text-sm theme-muted leading-relaxed max-w-xs mx-auto mb-6">
          The scheduled voting time has ended. Would you like to reopen voting for everyone?
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 rounded-2xl btn-theme text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "Reopening..." : "Reopen Booth"}
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

const MobileCloseBoothBottomSheet = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-lg theme-surface rounded-t-3xl p-6 pb-28 sm:pb-8 shadow-2xl border-t border-border animate-slideUp text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="w-6" />
          <h3 className="text-base font-bold theme-text">Close Booth</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-muted hover:theme-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Warning Icon (Screen 6) */}
        <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto my-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h4 className="text-lg font-bold theme-text mb-2">Close this booth?</h4>
        <p className="text-xs sm:text-sm theme-muted leading-relaxed max-w-xs mx-auto mb-6">
          This will stop voting and prevent new members from joining. You can still view the results.
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-error hover:bg-error/90 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            {loading ? "Closing..." : "Close Booth"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl theme-surface border border-border theme-text font-semibold text-sm hover:bg-accent-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


const MobileResetInviteBottomSheet = ({ isOpen, onClose, onConfirm, loading, currentCode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-lg theme-surface rounded-t-3xl p-6 pb-28 sm:pb-8 shadow-2xl border-t border-border animate-slideUp text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="w-6" />
          <h3 className="text-base font-bold theme-text">Reset Invite Code</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-muted hover:theme-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Warning / Refresh Icon */}
        <div className="w-16 h-16 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto my-4 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>

        <h4 className="text-lg font-bold theme-text mb-2">Generate new invite code?</h4>
        <p className="text-xs sm:text-sm theme-muted leading-relaxed max-w-xs mx-auto mb-4">
          This will immediately invalidate the current code and all existing share links. Anyone using the old link will no longer be able to join.
        </p>

        {currentCode && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border bg-black/5 dark:bg-white/5 mb-6 text-xs font-mono font-bold theme-text">
            <span className="text-[11px] font-normal theme-muted">Current code:</span>
            <span>{currentCode}</span>
          </div>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-warning hover:bg-warning/90 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "Resetting..." : "Reset Invite Code"}
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

const MobileDeleteBoothBottomSheet = ({ isOpen, onClose, onConfirm, loading, boothName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-lg theme-surface rounded-t-3xl p-6 pb-28 sm:pb-8 shadow-2xl border-t border-border animate-slideUp text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="w-6" />
          <h3 className="text-base font-bold theme-text">Delete Booth</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-muted hover:theme-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto my-4 shadow-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <h4 className="text-lg font-bold theme-text mb-2">Delete this booth permanently?</h4>
        {boothName && (
          <div className="inline-block px-3 py-1 rounded-xl bg-error/10 border border-error/20 text-error font-semibold text-xs mb-3 truncate max-w-xs">
            {boothName}
          </div>
        )}
        <p className="text-xs sm:text-sm theme-muted leading-relaxed max-w-xs mx-auto mb-6">
          This will permanently delete this booth. All members will lose access and this action cannot be undone.
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-error hover:bg-error/90 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            {loading ? "Deleting..." : "Permanently Delete"}
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

const MobileCandidateModal = ({ isOpen, onClose, onSave, mode, initialData, saving }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setName(initialData?.name || "");
      setDescription(initialData?.description || "");
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialData?.name, initialData?.description]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-lg theme-surface rounded-t-3xl p-6 pb-28 sm:pb-8 shadow-2xl border-t border-border animate-slideUp max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-6" />
          <h3 className="text-base font-bold theme-text">{mode === "edit" ? "Edit Candidate" : "Add Candidate"}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-muted hover:theme-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold theme-text mb-1">Candidate Name *</label>
            <input
              type="text"
              placeholder="e.g. Arpit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border theme-surface theme-text text-xs focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold theme-text mb-1">Role / Bio (optional)</label>
            <input
              type="text"
              placeholder="e.g. General Secretary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border theme-surface theme-text text-xs focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), description: description.trim() });
            }}
            disabled={saving || !name.trim()}
            className="w-full py-3 rounded-2xl btn-theme text-on-primary font-semibold text-xs shadow-md disabled:opacity-50 active:scale-95 transition-transform"
          >
            {saving ? "Saving..." : mode === "edit" ? "Update Candidate" : "Add Candidate"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl theme-surface border border-border theme-text font-semibold text-xs hover:bg-accent-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const MobileMemberActionBottomSheet = ({ isOpen, onClose, member, onRemove, isRemoving }) => {
  if (!isOpen || !member) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-lg theme-surface rounded-t-3xl p-6 pb-28 sm:pb-8 shadow-2xl border-t border-border animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-6" />
          <h3 className="text-base font-bold theme-text">Member Options</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-muted hover:theme-text">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-black/5 dark:bg-white/5 mb-6 min-w-0">
          <div className="w-10 h-10 rounded-full bg-accent-50 text-accent border border-accent/20 font-bold text-sm flex items-center justify-center shrink-0">
            {member.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold theme-text truncate">{member.user?.name}</div>
            <div className="text-xs theme-muted truncate">{member.user?.email || "No email"}</div>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onRemove(member.user?.id || member.user?._id)}
            disabled={isRemoving}
            className="w-full py-3 rounded-2xl bg-error hover:bg-error/90 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50 active:scale-95 transition-transform"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            {isRemoving ? "Removing..." : "Remove Member"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl theme-surface border border-border theme-text font-semibold text-xs hover:bg-accent-50"
          >
            Cancel
          </button>
        </div>
      </div>
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
    } catch {
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
