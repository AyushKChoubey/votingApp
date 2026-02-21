import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api, { boothService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/layout/Alert";
import { useToast } from "../../components/layout/Toast";
import { LoadingButton, PageLoading } from "../../components/layout/Loading";

const JoinBoothPage = () => {
  const [inviteCode, setInviteCode] = useState("");
  const [booth, setBooth] = useState(null);

  const [loading, setLoading] = useState(false);

  const [joining, setJoining] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingRequest, setPendingRequest] = useState(false);
  const socketRef = useRef(null);
  const boothRef = useRef(null); // Track current booth to avoid stale closure in socket handler
  const copyTimeoutRef = useRef(null);
  const { addToast } = useToast();

  const navigate = useNavigate();
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const checkInviteCode = useCallback(
    async (codeToCheck) => {
      if (!codeToCheck || codeToCheck.length < 4) return;

      setLoading(true);
      setError("");
      setBooth(null);

      try {
        const response = await api.get(
          `/api/booth/join/${codeToCheck.toUpperCase()}`,
        );

        if (response.success && response.data) {
          const { booth: boothData, isMember, isCreator } = response.data;

          if (isMember || isCreator) {
            // Use boothId for cleaner URLs
            const boothIdentifier = boothData.boothId || boothData.id;
            navigate(`/booth/${boothIdentifier}`);
            return;
          }

          // Show booth preview even if closed — UI will render an appropriate closed-state card
          setError("");
          setBooth(boothData);
        } else {
          setError("Invalid invite code");
          addToast("Invalid invite code", "error");
        }
      } catch (err) {
        // Prefer a clear message for 404 (not found) invite codes
        const status = err.status || err.response?.status;
        let msg;
        if (status === 404) {
          msg = "Invite not found — please verify the code or link";
        } else {
          msg = err.message || "Invalid invite code";
        }

        setError(msg);
        // show toast so it's visible regardless of inline alert
        try {
          addToast(msg, "error");
        } catch (e) {
          // ignore
        }
        setBooth(null);
      } finally {
        setLoading(false);
      }
    },
    [navigate, addToast],
  );

  useEffect(() => {
    if (code) {
      // Wait for auth initialization first
      if (isLoading) return;

      // If user is not authenticated, redirect them to login with invite+redirect so
      // after login they return to this join page with the code prefilled.
      if (!isAuthenticated) {
        navigate(`/login?invite=${code}&redirect=/booth/join/${code}`);
        return;
      }

      setInviteCode(code.toUpperCase());
      // Auto-check the invite code from the URL
      checkInviteCode(code);
    }

    // Handle error messages from direct invite links
    const errorParam = searchParams.get("error");
    const joined = searchParams.get("joined");

    if (errorParam) {
      const errorMessages = {
        invalid_code: "Invalid invite code",
        booth_full: "This booth is full and cannot accept more members",
        booth_inactive: "This booth is not currently active",
        domain_restricted:
          "Your email domain is not allowed to join this booth",
        join_failed: "Failed to join booth. Please try again.",
        server_error: "Server error occurred. Please try again later.",
      };
      const msg =
        errorMessages[errorParam] ||
        "An error occurred while joining the booth";
      setError(msg);
      // Show a toast as well so users don't miss the message
      try {
        addToast(msg, "error");
      } catch (e) {
        // no-op if toast system isn't initialized
      }
    }

    if (joined === "true") {
      setSuccess("Successfully joined the booth!");
    }
  }, [
    code,
    searchParams,
    isLoading,
    isAuthenticated,
    navigate,
    addToast,
    checkInviteCode,
  ]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        // Clear any pending copy-to-clipboard timeout to avoid state updates after unmount
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
          copyTimeoutRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // Sync boothRef with booth state to avoid stale closures in socket handler
  useEffect(() => {
    boothRef.current = booth;
  }, [booth]);

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      checkInviteCode(inviteCode.trim());
    }
  };

  const handleJoinBooth = async () => {
    if (!booth) return;

    try {
      setJoining(true);
      setError("");

      const response = await boothService.joinBooth(inviteCode);

      if (response.success) {
        // If server indicates the join is pending approval, do not navigate — show a pending message instead
        const msg = response.message || "";
        if (
          /pending/i.test(msg) ||
          (!response.boothId && booth?.settings?.requireApproval)
        ) {
          setSuccess(msg || "Join request submitted and is pending approval");
          setPendingRequest(true);
          // Initialize socket listener to receive approve/reject events for this user
          (async () => {
            try {
              if (!socketRef.current) {
                const mod = await import("socket.io-client");
                const ioClient = mod.io || mod.default || mod;
                const SOCKET_URL =
                  import.meta.env.VITE_API_URL || "http://localhost:5000";
                const token = localStorage.getItem("token");
                const socket = ioClient(SOCKET_URL, {
                  transports: ["websocket", "polling"],
                  auth: { token },
                });
                socketRef.current = socket;

                socket.on("connect", () => {
                  // Optionally join booth room (not required for user notifications)
                });

                socket.on("joinRequest:status", async (payload) => {
                  try {
                    if (!payload) return;
                    const payloadBoothId = (payload.boothId || "").toString();
                    // Use ref to get current booth value (avoid stale closure)
                    const currentBooth = boothRef.current;
                    const currentBoothId = (
                      currentBooth?.id ||
                      currentBooth?._id ||
                      ""
                    ).toString();
                    if (!payloadBoothId || payloadBoothId !== currentBoothId)
                      return;

                    if (payload.status === "approved") {
                      addToast(
                        payload.message ||
                          "Your join request has been approved.",
                        "success",
                      );
                      // Refresh booth details and navigate into the booth
                      try {
                        await boothService.getBooth(payloadBoothId);
                      } catch (e) {
                        // ignore
                      }
                      // cleanup socket and navigate
                      try {
                        socketRef.current.disconnect();
                      } catch (e) {}
                      socketRef.current = null;
                      // Use boothId from payload for navigation
                      navigate(`/booth/${payloadBoothId}`);
                    } else if (payload.status === "rejected") {
                      addToast(
                        payload.message ||
                          "Your join request has been rejected.",
                        "error",
                      );
                      setPendingRequest(false);
                      // keep socket open briefly or disconnect
                      try {
                        socketRef.current.disconnect();
                      } catch (e) {}
                      socketRef.current = null;
                    }
                  } catch (innerErr) {
                    console.error(
                      "Error handling joinRequest:status",
                      innerErr,
                    );
                  }
                });

                socket.on("connect_error", (err) => {
                  // connection error handled silently; keep socket lifecycle stable
                });
              }
            } catch (sockErr) {
              console.error(
                "Failed to initialize socket for join requests",
                sockErr,
              );
            }
          })();
          addToast(
            msg || "Join request submitted and is pending approval",
            "info",
          );
          // Do not navigate; user must wait for approval
        } else {
          // Navigate immediately with success param - use boothId from response
          const boothIdentifier = response.boothId || booth.boothId || booth.id;
          navigate(`/booth/${boothIdentifier}?joined=true`);
        }
      } else {
        setError(response.error || "Failed to join booth");
        addToast(response.error || "Failed to join booth", "error");
      }
    } catch (err) {
      // Provide a friendly message when booth is closed or full
      const status = err?.response?.status || err?.status;
      if (
        status === 400 &&
        /not accepting|full|inactive/i.test(err.message || "")
      ) {
        if (/full/i.test(err.message || "")) {
          setError("This booth is full and cannot accept more members.");
          addToast(
            "This booth is full and cannot accept more members.",
            "error",
          );
        } else {
          setError("This booth is closed and is not accepting new members.");
          addToast(
            "This booth is closed and is not accepting new members.",
            "error",
          );
        }
      } else if (status === 403) {
        setError(err.message || "You are not allowed to join this booth.");
        addToast(
          err.message || "You are not allowed to join this booth.",
          "error",
        );
      } else {
        setError(err.message || "Failed to join booth");
        addToast(err.message || "Failed to join booth", "error");
      }
    } finally {
      setJoining(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!booth) return;
    const link = `${window.location.origin}/booth/join/${booth.inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setSuccess("Invite link copied to clipboard");
      // store timeout id so we can clear it if the component unmounts
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setSuccess("");
        copyTimeoutRef.current = null;
      }, 2500);
    } catch (err) {
      setError("Failed to copy invite link");
    }
  };

  // Show loading state while auth is initializing
  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <div className="min-h-screen theme-bg py-6 px-3 sm:py-8 sm:px-6 lg:px-8 relative overflow-hidden">
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

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          {/* Invitation Banner - Show when code is from URL (invite link) */}
          {code ? (
            <div className="glass-card p-4 mb-6 text-center border-accent animate-fadeIn">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-accent/10 rounded-full mb-3">
                <svg
                  className="w-5 h-5 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M9 10l3-2 3 2"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold theme-text mb-2">
                You've Been Invited!
              </h2>
              <p className="text-sm theme-muted">
                Someone has invited you to participate in their voting booth.
                Review the details below and join when ready.
              </p>
              <p className="text-xs theme-muted mt-2">
                Click on the join button to request access if needed or directly
                join the booth.
              </p>
            </div>
          ) : null}

          <div className="text-center animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold theme-text mb-3 sm:mb-4">
              {code ? "Join Invited " : "Join a "}
              <span className="text-gradient">Booth</span>
            </h1>
            <p
              className="theme-muted text-sm sm:text-lg mb-6 sm:mb-8 px-2 animate-fadeIn"
              style={{ "--stagger-index": 1 }}
            >
              {code
                ? "You can review the booth details and join below"
                : "Enter an invite code to join a booth"}
            </p>

            {/* Compact hint on mobile, full instructions on sm+ */}
            {!code && (
              <p className="text-xs theme-muted mb-3 sm:hidden">
                Tip: paste an invite link or enter the code below.
              </p>
            )}
          </div>

          {/* Compact hint on mobile, full instructions on sm+ */}
          {!code && (
            <div
              className="hidden sm:block animate-fadeIn"
              style={{ "--stagger-index": 2 }}
            >
              {/* How to Join Instructions (desktop) */}
              <div className="glass-card p-3 max-w-2xl mx-auto border-accent">
                <h3 className="text-sm font-semibold text-accent mb-2">
                  💡 How to Join:
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-xs theme-muted">
                  <div className="flex items-start gap-2">
                    <span className="text-accent">🔗</span>
                    <span>
                      <strong>Direct Link:</strong> Click the invite link shared
                      by the booth creator
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-accent">🔤</span>
                    <span>
                      <strong>Manual Entry:</strong> Enter the invite code below
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alerts are shown via toast; inline alerts removed */}

        {/* Invite Code Section */}
        <div
          className="glass-card overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl animate-fadeIn"
          style={{ "--stagger-index": 3 }}
        >
          <div className="p-6 sm:p-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold theme-text mb-6 text-center">
                {code ? "Invite Code from Link" : "Enter Invite Code"}
              </h2>

              {!code ? (
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="inviteCode"
                      className="block text-sm font-medium theme-text mb-2"
                    >
                      Booth Invite Code
                    </label>
                    <input
                      id="inviteCode"
                      type="text"
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter 6-8 character code"
                      className="w-full px-3 py-2 bg-theme-surface border-border rounded-lg theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 font-mono text-center text-base sm:text-lg sm:tracking-wider"
                      maxLength={8}
                    />
                    <p className="text-sm theme-muted mt-2">
                      Ask the booth creator for the invite code
                    </p>
                  </div>

                  <LoadingButton
                    type="submit"
                    loading={loading}
                    disabled={!inviteCode.trim() || inviteCode.length < 4}
                    variant="teal"
                    size="lg"
                    className="w-full py-2.5 text-sm"
                  >
                    Check Invite Code
                  </LoadingButton>
                </form>
              ) : null}

              {/* Booth Preview */}
              {booth && (
                <div className="max-w-md mx-auto mt-8">
                  <div
                    className={`glass-card p-4 sm:p-6 ${code ? "border-accent" : ""}`}
                  >
                    <div className="text-center mb-3">
                      <h3 className="text-md sm:text-lg font-semibold theme-text">
                        {booth.name}
                      </h3>
                      <p className="theme-muted text-sm sm:text-base font-bold font-mono mt-1">
                        ID: {booth.boothId}
                      </p>
                      <p className="theme-muted text-xs sm:text-sm mt-1 line-clamp-2">
                        {booth.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-center mb-3">
                      <div className="theme-surface rounded-lg p-2">
                        <div className="font-semibold theme-text text-sm">
                          {booth.memberCount || 0}
                        </div>
                        <div className="theme-muted text-xs">Members</div>
                      </div>
                      <div className="theme-surface rounded-lg p-2">
                        <div className="font-semibold theme-text text-sm truncate">
                          {booth.creator?.name ||
                            booth.creator?.email ||
                            "Unknown"}
                        </div>
                        <div className="theme-muted text-xs">Created by</div>
                      </div>
                    </div>

                    {booth.status === "active" ? (
                      <LoadingButton
                        onClick={handleJoinBooth}
                        loading={joining}
                        variant="teal"
                        size="lg"
                        className="w-full py-2.5 text-sm"
                      >
                        Join This Booth
                      </LoadingButton>
                    ) : (
                      <div className="bg-error-50 border-error rounded-xl p-3 text-center border">
                        <div className="flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 text-error"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14"
                            />
                          </svg>
                        </div>
                        <h4 className="text-md font-semibold theme-text mb-1">
                          This booth is closed
                        </h4>
                        <p className="text-xs theme-muted mb-3">
                          The organizer has closed this booth and is not
                          accepting new members.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                          {booth.creator?.email && (
                            <a
                              href={`mailto:${booth.creator.email}?subject=${encodeURIComponent(`Request to join ${booth.name}`)}`}
                              className="px-3 py-2 bg-theme-surface border border-border rounded-lg text-xs theme-text hover:bg-theme-surface/80 w-full sm:w-auto text-center"
                            >
                              Contact organizer
                            </a>
                          )}

                          <button
                            onClick={handleCopyInvite}
                            className="btn-theme btn-theme-accent px-3 py-2 text-xs w-full sm:w-auto"
                          >
                            Copy invite link
                          </button>
                        </div>
                      </div>
                    )}

                    {pendingRequest && (
                      <div className="mt-4 bg-warning-50 border-warning rounded-lg p-3 text-center border">
                        <div className="font-semibold text-warning">
                          Join request pending
                        </div>
                        <div className="text-sm theme-muted mt-1">
                          Your request has been submitted and is awaiting
                          approval from the organizer. You will be notified here
                          when a decision is made.
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="mt-4">
                        <Alert
                          type="error"
                          message={error}
                          onClose={() => setError("")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/booth/create")}
              className="btn-theme btn-theme-success py-2 px-6 font-semibold"
            >
              Create New Booth
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinBoothPage;
