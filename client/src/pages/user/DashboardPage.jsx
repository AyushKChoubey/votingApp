import {
  useState,
  useEffect,
  useCallback,
  useRef,
  lazy,
  Suspense,
} from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import ThemeToggle from "../../components/layout/ThemeToggle";
import BackButton from "../../components/layout/BackButton";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  Loading,
  PageLoading,
  Skeleton,
  LoadingButton,
} from "../../components/layout/Loading";
import { Alert } from "../../components/layout/Alert";
import { useToast } from "../../components/layout/Toast";
import Button from "../../components/layout/Button";
const QRCodeModal = lazy(() =>
  import("../../components/booth/QRCodeModal").then((m) => ({
    default: m.QRCodeModal,
  })),
);

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [qrModalData, setQrModalData] = useState(null);
  const [boothsTab, setBoothsTab] = useState("created");
  const [boothsSearch, setBoothsSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchParams] = useSearchParams();
  const isBoothsView = searchParams.get("view") === "booths";

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Helper: check JWT presence and expiry (simple client-side check)
  const isTokenValid = () => {
    try {
      const raw = localStorage.getItem("token");
      if (!raw) return false;
      const parts = raw.split(".");
      if (parts.length < 2) return false;
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (!payload) return false;
      if (!payload.exp) return true; // no exp claim -> assume valid
      const expMs = payload.exp * 1000;
      return Date.now() < expMs;
    } catch (e) {
      return false;
    }
  };

  const fetchInFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  const fetchDashboardData = useCallback(async () => {
    // Prevent duplicate concurrent fetches or very-quick repeated calls
    try {
      if (fetchInFlightRef.current) return;
      const now = Date.now();
      // If last fetch was within the last 1500ms, skip to avoid duplicate calls
      if (lastFetchAtRef.current && now - lastFetchAtRef.current < 1500) return;

      if (!localStorage.getItem("token")) {
        try {
          await logout();
        } catch (e) {}
        navigate("/", { replace: true });
        return;
      }

      fetchInFlightRef.current = true;
      lastFetchAtRef.current = now;

      setLoading(true);

      const response = await api.get("/api/booth/dashboard");

      // The API returns { success: true, data: { createdBooths, joinedBooths, stats, user } }
      // The axios interceptor returns response.data directly
      if (response && response.success && response.data) {
        setDashboardData(response.data);
        setError("");
        setLastUpdated(new Date());
      } else {
        // Unexpected or unauthenticated
        try {
          localStorage.removeItem("token");
        } catch (e) {}
        try {
          await logout();
        } catch (e) {}
        navigate("/", { replace: true });
        return;
      }
    } catch (err) {
      // Dashboard fetch error
      // If API returned unauthorized, clear token and redirect to home
      if (
        err?.response?.status === 401 ||
        err?.response?.status === 403 ||
        !localStorage.getItem("token")
      ) {
        try {
          localStorage.removeItem("token");
        } catch (e) {}
        try {
          await logout();
        } catch (e) {}
        navigate("/", { replace: true });
        return;
      }
      setError(err.message || "Failed to load dashboard data");
    } finally {
      fetchInFlightRef.current = false;
      setLoading(false);
    }
  }, [logout, navigate]);

  // Initial load — validate token first to avoid showing dashboard for expired sessions
  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem("token") || !isTokenValid()) {
      try {
        localStorage.removeItem("token");
      } catch (e) {}
      try {
        logout();
      } catch (e) {}
      navigate("/", { replace: true });
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, fetchDashboardData, logout, navigate]);

  // note: refresh via location.state was removed — dashboard now relies on explicit refresh actions

  const copyInviteCode = useCallback(
    async (inviteCode) => {
      try {
        await navigator.clipboard.writeText(inviteCode);
        addToast(
          `Invite code ${inviteCode} copied to clipboard.`,
          "success",
          2000,
        );
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        try {
          const textArea = document.createElement("textarea");
          textArea.value = inviteCode;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          addToast(`Invite code ${inviteCode} copied.`, "success", 2000);
        } catch (fallbackErr) {
          addToast("❌ Failed to copy invite code", "error");
        }
      }
    },
    [addToast],
  );

  const copyInviteLink = useCallback(
    async (inviteCode) => {
      try {
        const inviteLink = `${window.location.origin}/booth/join/${inviteCode}`;
        await navigator.clipboard.writeText(inviteLink);
        addToast(`Invite link copied to clipboard.`, "success", 2000);
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        try {
          const inviteLink = `${window.location.origin}/booth/join/${inviteCode}`;
          const textArea = document.createElement("textarea");
          textArea.value = inviteLink;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          addToast(`Invite link copied.`, "success", 2000);
        } catch (fallbackErr) {
          addToast("❌ Failed to copy invite link", "error");
        }
      }
    },
    [addToast],
  );

  const showQRCode = useCallback((inviteCode, boothName) => {
    const inviteLink = `${window.location.origin}/booth/join/${inviteCode}`;
    setQrModalData({ inviteLink, inviteCode, boothName });
  }, []);

  const downloadQRCode = useCallback(() => {
    const canvas = document.getElementById("qr-code-canvas");
    if (!canvas) {
      addToast("QR code not available", "error");
      return;
    }

    const safeBoothName =
      qrModalData && qrModalData.boothName
        ? qrModalData.boothName.replace(/\s+/g, "-")
        : "qr-code";

    try {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${safeBoothName}-QR.png`;
      link.href = url;
      link.click();
      addToast("QR code downloaded", "success");
    } catch (e) {
      addToast("Failed to download QR code", "error");
    }
  }, [qrModalData, addToast]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAuthenticated || !user || !localStorage.getItem("token")) {
    return <Navigate to="/" replace />;
  }

  // Loading state with modern skeleton
  if (loading) {
    return (
      <div className="min-h-screen theme-bg p-6">
        <div className="max-w-7xl mx-auto animate-fadeIn">
          {/* Header skeleton */}
          <div className="text-center space-y-4 mb-8">
            <Skeleton width="w-64" height="h-8" className="mx-auto" />
            <Skeleton width="w-96" height="h-4" className="mx-auto" />
          </div>

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 border border-border">
                <Skeleton
                  width="w-16"
                  height="h-16"
                  variant="avatar"
                  className="mx-auto mb-4"
                />
                <Skeleton width="w-20" height="h-8" className="mx-auto mb-2" />
                <Skeleton width="w-32" height="h-4" className="mx-auto" />
              </div>
            ))}
          </div>

          {/* Booths section skeleton */}
          <div className="glass-card p-8 border border-border">
            <Skeleton width="w-48" height="h-6" className="mb-6" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border border-border rounded-xl p-6">
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
      <div className="min-h-screen theme-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Alert type="error" message={error} />
          <Button
            variant="primary"
            size="lg"
            onClick={() => fetchDashboardData()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const {
    createdBooths = [],
    joinedBooths = [],
    stats = {},
    user: userData = {},
  } = dashboardData || {};

  const firstName = (userData.name || user?.name || "User").split(" ")[0];

  // My Booths view filtered list
  const activeBoothsList = boothsTab === "created" ? createdBooths : joinedBooths;
  const filteredBooths = activeBoothsList.filter((booth) => {
    // Status filter
    if (statusFilter !== "all" && booth.status !== statusFilter) {
      return false;
    }
    // Search query
    if (!boothsSearch.trim()) return true;
    const q = boothsSearch.toLowerCase();
    return (
      booth.name?.toLowerCase().includes(q) ||
      booth.boothId?.toLowerCase().includes(q) ||
      booth.inviteCode?.toLowerCase().includes(q)
    );
  });

  // Recent activity: last 3 booths touched across created + joined
  const recentActivity = [...createdBooths, ...joinedBooths]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const renderDesktopDashboard = () => (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-12 text-center">
          <h1 className="text-3xl lg:text-5xl font-bold theme-text mb-4 animate-fadeIn">
            Welcome back,{" "}
            <span className="text-gradient">{firstName}</span>!
          </h1>
          <p className="theme-muted text-base lg:text-lg animate-fadeIn">
            Manage your booths and participate in polls
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 stagger-children">
          {[
            { title: "Created Booths", value: stats.totalBooths || 0, icon: "booth", color: "primary" },
            { title: "Joined Booths", value: stats.joinedBooths || 0, icon: "users", color: "success" },
            { title: "Votes Received", value: stats.totalVotes || 0, icon: "votes", color: "secondary" },
            { title: "Active Booths", value: stats.activeBooths || 0, icon: "active", color: "warning" },
          ].map((card, i) => (
            <div key={card.title} className="animate-fadeIn" style={{ "--stagger-index": i }}>
              <StatsCard {...card} />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4 stagger-children">
            <Button variant="primary" size="lg" to="/booth/create" fullWidth className="sm:w-auto animate-fadeIn"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
              iconPosition="left" style={{ "--stagger-index": 0 }}>
              Create New Booth
            </Button>
            <Button variant="secondary" size="lg" to="/booth/join" fullWidth className="sm:w-auto animate-fadeIn"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              iconPosition="left" style={{ "--stagger-index": 1 }}>
              Join a Booth
            </Button>
          </div>
        </div>

        {/* Booth lists side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Created */}
          <div className="flex flex-col h-full animate-fadeIn" style={{ "--stagger-index": 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold theme-text flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                </span>
                <span>My Booths</span>
                <span className="glass-card text-sm px-3 py-1.5 rounded-full theme-text font-bold">{createdBooths?.length || 0}</span>
              </h2>
            </div>
            {createdBooths.length > 0 ? (
              <div className="flex-1 glass-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-[500px] overflow-y-auto p-5 space-y-4">
                  {createdBooths.map((booth) => (
                    <CreatedBoothCard key={booth.id} booth={booth} onCopyInviteCode={copyInviteCode} onCopyInviteLink={copyInviteLink} onShowQRCode={showQRCode} formatDate={formatDate} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="No booths created yet" description="Create your first voting booth to get started" actionText="Create Your First Booth" actionLink="/booth/create" icon="booth" />
            )}
          </div>

          {/* Joined */}
          <div className="flex flex-col h-full animate-fadeIn" style={{ "--stagger-index": 1 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold theme-text flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </span>
                <span>Joined Booths</span>
                <span className="glass-card text-sm px-3 py-1.5 rounded-full theme-text font-bold">{joinedBooths?.length || 0}</span>
              </h2>
            </div>
            {joinedBooths.length > 0 ? (
              <div className="flex-1 glass-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="h-[500px] overflow-y-auto p-5 space-y-4">
                  {joinedBooths.map((booth) => (
                    <JoinedBoothCard key={booth.id} booth={booth} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="No joined booths yet" description="Join a voting booth to participate in polls" actionText="Join a Booth" actionLink="/booth/join" icon="users" />
            )}
          </div>
        </div>

        {error && <div className="mt-6"><Alert type="warning" message={`Warning: ${error}`} /></div>}

        {qrModalData && (
          <Suspense fallback={null}>
            <QRCodeModal data={qrModalData} onClose={() => setQrModalData(null)} onDownload={downloadQRCode} />
          </Suspense>
        )}
      </div>
    </div>
  );

  if (isBoothsView) {
    // ── MY BOOTHS SCREEN (Screen 2 from mockup - mobile only) ───────────────
    return (
      <div className="min-h-screen theme-bg">
        {/* Mobile-only view */}
        <div className="md:hidden px-4 pb-6">
          {/* Mobile header */}
          <div className="flex items-center justify-between pt-4 pb-3">
            <div className="flex items-center gap-2">
              <BackButton />
              <h1 className="text-xl font-bold theme-text">My Booths</h1>
            </div>
            <ThemeToggle />
          </div>

        <div className="max-w-7xl mx-auto">
          {/* Search bar & Filter */}
          <div className="relative mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-3.5 h-3.5 theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search booths..."
                value={boothsSearch}
                onChange={(e) => setBoothsSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-2 rounded-xl border border-border theme-surface theme-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:theme-muted"
              />
              {boothsSearch && (
                <button
                  type="button"
                  onClick={() => setBoothsSearch("")}
                  className="absolute inset-y-0 right-2.5 flex items-center text-xs theme-muted hover:text-accent"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterDropdown((prev) => !prev)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                  statusFilter !== "all"
                    ? "border-accent bg-accent-50 text-accent"
                    : "border-border theme-surface theme-text hover:bg-accent-50"
                }`}
                aria-label="Filter booths"
                title="Filter booths by status"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>

              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <div
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border theme-surface shadow-xl py-1 z-30 animate-fadeIn"
                >
                  <div className="px-3 py-1.5 border-b border-border text-[11px] font-bold uppercase tracking-wider theme-muted">
                    Filter by status
                  </div>
                  {[
                    { key: "all", label: "All" },
                    { key: "active", label: "Active" },
                    { key: "closed", label: "Closed" },
                    { key: "draft", label: "Draft" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => {
                        setStatusFilter(filter.key);
                        setShowFilterDropdown(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium transition-colors ${
                        statusFilter === filter.key
                          ? "bg-accent-50 text-accent font-bold"
                          : "theme-text hover:bg-accent-50"
                      }`}
                    >
                      <span>{filter.label}</span>
                      {statusFilter === filter.key && (
                        <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active filter badge if any */}
          {statusFilter !== "all" && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs theme-muted">Filtered by:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-50 text-accent border border-accent/20">
                <span className="capitalize">{statusFilter}</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className="hover:opacity-80"
                  aria-label="Clear filter"
                >
                  ✕
                </button>
              </span>
            </div>
          )}

          {/* Created / Joined tab pills */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setBoothsTab("created")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                boothsTab === "created"
                  ? "btn-theme text-on-primary"
                  : "theme-surface border border-border theme-text hover:bg-accent-50"
              }`}
            >
              Created ({createdBooths.length})
            </button>
            <button
              onClick={() => setBoothsTab("joined")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                boothsTab === "joined"
                  ? "btn-theme text-on-primary"
                  : "theme-surface border border-border theme-text hover:bg-accent-50"
              }`}
            >
              Joined ({joinedBooths.length})
            </button>
          </div>

          {/* Booth list */}
          {filteredBooths.length > 0 ? (
            <div className="space-y-3">
              {filteredBooths.map((booth) =>
                boothsTab === "created" ? (
                  <CreatedBoothCard
                    key={booth.id}
                    booth={booth}
                    onCopyInviteCode={copyInviteCode}
                    onCopyInviteLink={copyInviteLink}
                    onShowQRCode={showQRCode}
                    formatDate={formatDate}
                  />
                ) : (
                  <JoinedBoothCard key={booth.id} booth={booth} />
                )
              )}
            </div>
          ) : boothsSearch.trim() || statusFilter !== "all" ? (
            <div className="theme-surface rounded-xl shadow-sm p-8 border border-border text-center">
              <div className="w-12 h-12 rounded-full bg-accent-50 text-accent mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
              </div>
              <p className="theme-text text-base font-bold mb-1">No booths found</p>
              <p className="theme-muted text-xs sm:text-sm mb-4">
                {boothsSearch.trim() && statusFilter !== "all"
                  ? `No ${statusFilter} booths matching "${boothsSearch}"`
                  : boothsSearch.trim()
                  ? `No booths matching "${boothsSearch}"`
                  : `No ${statusFilter} booths available`}
              </p>
              <div className="flex justify-center gap-2">
                {boothsSearch.trim() && (
                  <button
                    type="button"
                    onClick={() => setBoothsSearch("")}
                    className="px-3 py-1.5 rounded-lg border border-border theme-surface text-xs font-semibold theme-text hover:bg-accent-50"
                  >
                    Clear Search
                  </button>
                )}
                {statusFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className="px-3 py-1.5 rounded-lg border border-border theme-surface text-xs font-semibold theme-text hover:bg-accent-50"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              title={boothsTab === "created" ? "No booths created yet" : "No joined booths yet"}
              description={boothsTab === "created" ? "Create your first voting booth to get started" : "Join a voting booth to participate in polls"}
              actionText={boothsTab === "created" ? "Create a Booth" : "Join a Booth"}
              actionLink={boothsTab === "created" ? "/booth/create" : "/booth/join"}
              icon={boothsTab === "created" ? "booth" : "users"}
            />
          )}
        </div>

        {/* QR Code Modal */}
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

        {/* Desktop view: automatically render regular desktop dashboard */}
        <div className="hidden md:block">
          {renderDesktopDashboard()}
        </div>
      </div>
    );
  }

  // ── HOME / DASHBOARD SCREEN (Screen 1 from mockup) ────────────────────────
  return (
    <div className="min-h-screen theme-bg">
      {/* ── MOBILE HOME ── */}
      <div className="md:hidden px-4 pb-6">
        {/* App bar */}
        <div className="flex items-center justify-between pt-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl btn-theme shadow-sm">
              <svg className="h-5 w-5 text-on-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span className="text-lg font-bold theme-text">VoteBooth</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Greeting */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold theme-text">Welcome back,<br />{firstName}!</h1>
          <p className="text-sm theme-muted mt-1">Manage your booths and participate in polls</p>
        </div>

        {/* Stat cards 2×2 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Created", value: stats.totalBooths || 0, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
            { label: "Joined", value: stats.joinedBooths || 0, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
            { label: "Votes", value: stats.totalVotes || 0, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { label: "Active", value: stats.activeBooths || 0, icon: "M13 10V3L4 14h7v7l9-11h-7z" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="theme-surface rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs theme-muted">{label}</p>
                  <p className="mt-1.5 text-2xl font-bold theme-text">{value}</p>
                </div>
                <span className="text-accent mt-0.5">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="space-y-2 mb-6">
          <Link
            to="/booth/create"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl btn-theme text-sm font-bold shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Create New Booth
          </Link>
          <Link
            to="/booth/join"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl theme-surface border border-border theme-text text-sm font-bold"
          >
            <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l6-6m-3-3h3a3 3 0 013 3v3m-6 6H9a3 3 0 01-3-3v-3" />
            </svg>
            Join a Booth
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold theme-text">Recent Activity</h2>
          <Link to="/dashboard?view=booths" className="text-xs font-semibold text-accent">
            See all
          </Link>
        </div>
        <div className="space-y-2">
          {recentActivity.length > 0 ? (
            recentActivity.map((booth, idx) => (
              <Link
                key={`${booth.id}-${idx}`}
                to={`/booth/${booth.boothId || booth.id}`}
                className="flex items-center gap-3 rounded-xl theme-surface border border-border px-3 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d={
                      idx === 0
                        ? "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        : "M13 10V3L4 14h7v7l9-11h-7z"
                    } />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold theme-text">{booth.name}</span>
                  <span className="block text-xs theme-muted">{formatDate(booth.createdAt)}</span>
                </span>
                <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  booth.status === "active"
                    ? "bg-green-100 text-green-700"
                    : booth.status === "closed"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {booth.status?.charAt(0).toUpperCase() + booth.status?.slice(1) || "Active"}
                </span>
              </Link>
            ))
          ) : (
            <p className="rounded-xl theme-surface border border-border px-4 py-4 text-sm theme-muted text-center">
              Your recent booth activity will appear here.
            </p>
          )}
        </div>
      </div>

      {/* ── DESKTOP HOME (unchanged layout) ── */}
      <div className="hidden md:block">
        {renderDesktopDashboard()}
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, color, refreshing }) {
  const colorVariants = {
    primary: "card-variant-primary",
    success: "card-variant-success",
    secondary: "card-variant-secondary",
    warning: "card-variant-warning",
  };

  const icons = {
    booth: (
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    users: (
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
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
    ),
    votes: (
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
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
    ),
    active: (
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  };

  return (
    <div className="glass-card rounded-xl shadow-lg p-4 sm:p-6 border border-border transition-all duration-300 hover:shadow-xl card-hover">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="theme-muted text-xs sm:text-sm truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold theme-text">
            {refreshing ? (
              <span className="inline-block animate-pulse theme-surface h-6 sm:h-8 w-8 sm:w-12 rounded" />
            ) : (
              value
            )}
          </p>
        </div>
        <div
          className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colorVariants[color] || "card-variant-primary"} flex-shrink-0 ml-2`}
        >
          {icons[icon]}
        </div>
      </div>
    </div>
  );
}

// Created Booth Card Component
function CreatedBoothCard({
  booth,
  onCopyInviteCode,
  onCopyInviteLink,
  onShowQRCode,
  formatDate,
}) {
  const navigate = useNavigate();
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const boothPath = `/booth/${booth.boothId || booth.id}`;

  return (
    <div
      onClick={() => navigate(boothPath)}
      className="theme-surface rounded-xl shadow-sm hover:shadow-lg border border-border p-4 transition-all duration-300 card-hover overflow-hidden cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold theme-muted mb-1 font-mono">
            Booth ID: {booth.boothId}
          </p>
          <h3 className="text-base sm:text-lg font-bold theme-text mb-1 truncate break-all">
            {booth.name}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm theme-muted">
            {" "}
            <span className="truncate">
              Created {formatDate(booth.createdAt)}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="font-mono text-xs theme-surface border border-border px-2 py-0.5 rounded theme-text">
              #{booth.inviteCode}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 ml-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              booth.status === "active"
                ? "bg-green-100 text-green-600"
                : booth.status === "closed"
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {booth.status?.charAt(0).toUpperCase() + booth.status?.slice(1) ||
              "Active"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm theme-muted mb-3 theme-surface rounded-lg p-2 border border-border">
        <div className="flex items-center gap-1">
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          <span>{booth.memberCount || 0} members</span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{booth.totalVotes || 0} votes</span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
          <span>{booth.candidateCount || 0} candidates</span>
        </div>
      </div>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="secondary"
          size="sm"
          to={`/booth/${booth.boothId || booth.id}/admin`}
          className="flex-1"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        >
          Manage
        </Button>
        <div className="relative">
          <button
            onClick={() => setShowInviteOptions(!showInviteOptions)}
            className="theme-surface border border-border hover:btn-theme py-2 px-3 rounded-lg text-center transition-all duration-200 text-xs sm:text-sm font-medium flex items-center gap-1 theme-text"
            title="Invite options"
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
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
                d="m19 9-7 7-7-7"
              />
            </svg>
          </button>

          {showInviteOptions && (
            <div
              className="absolute right-0 bottom-full mb-2 w-48 rounded-lg shadow-xl border border-border z-10 theme-text"
              style={{ backgroundColor: "var(--color-bg)" }}
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    onCopyInviteCode(booth.inviteCode);
                    setShowInviteOptions(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm theme-text hover:btn-theme transition-colors"
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Code
                  <span className="ml-auto text-xs font-mono theme-muted">
                    {booth.inviteCode}
                  </span>
                </button>
                <button
                  onClick={() => {
                    onCopyInviteLink(booth.inviteCode);
                    setShowInviteOptions(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm theme-text hover:btn-theme transition-colors"
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Copy Link
                </button>
                <button
                  onClick={() => {
                    onShowQRCode(booth.inviteCode, booth.name);
                    setShowInviteOptions(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm theme-text hover:btn-theme transition-colors border-t border-border"
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
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  Show QR Code
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
    <div className="theme-surface rounded-xl shadow-sm hover:shadow-lg p-4 border border-border hover:border-accent/30 transition-all duration-300 card-hover overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold theme-muted mb-1 font-mono">
            Booth ID: {booth.boothId}
          </p>
          <h3 className="text-base sm:text-lg font-bold theme-text mb-1 truncate break-all">
            {booth.name}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm theme-muted">
            <span className="truncate">
              Created by {booth.creator?.name || "Anonymous"}
            </span>
          </div>
        </div>
        <div className="flex items-end ml-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              booth.status === "active"
                ? "bg-green-100 text-green-600"
                : booth.status === "closed"
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {booth.status?.charAt(0).toUpperCase() + booth.status?.slice(1) ||
              "Active"}
            {booth.hasVoted && " • Voted"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm theme-muted mb-3 theme-surface rounded-lg p-2 border border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="font-medium">
              {booth.memberCount || 0} members
            </span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
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
            <span className="font-medium">{booth.totalVotes || 0} votes</span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            <span className="font-medium">
              {booth.candidateCount || 0} candidates
            </span>
          </div>
        </div>
      </div>

      <Link
        to={`/booth/${booth.boothId || booth.id}`}
        className="w-full btn-theme py-2 px-4 rounded-lg text-center transition-all duration-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
      >
        {booth.hasVoted ? (
          <>
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
            <span>View Results</span>
          </>
        ) : (
          <>
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Vote Now</span>
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
      <svg
        className="w-16 h-16 text-gray-400 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    users: (
      <svg
        className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
    ),
  };

  return (
    <div className="theme-surface rounded-xl shadow-lg p-8 border border-border text-center">
      {icons[icon] && (
        <div className="mx-auto mb-4">
          {icons[icon].props
            ? // clone to adjust className
              icons[icon]
            : icons[icon]}
        </div>
      )}
      <p className="theme-text text-lg mb-4">{title}</p>
      <p className="theme-muted text-sm mb-6">{description}</p>
      <Button to={actionLink} variant="primary" size="md">
        {actionText}
      </Button>
    </div>
  );
}
export default Dashboard;
