import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import api, { boothService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/layout/Toast";
import { PageLoading } from "../../components/layout/Loading";
import BackButton from "../../components/layout/BackButton";
import AppWatermark from "../../components/layout/AuthWatermarkBackground";
import { WebQRScannerModal } from "../../components/booth/WebQRScannerModal";
import { useRegisterModal } from "../../hooks/useRegisterModal";
import {
  scanQRCodeNative,
  decodeQRFromImageFile,
  parseInviteCode,
} from "../../services/qrScannerService";

const QRCodeModal = lazy(() =>
  import("../../components/booth/QRCodeModal").then((m) => ({
    default: m.QRCodeModal,
  })),
);

const JoinBoothPage = () => {
  const [inviteCode, setInviteCode] = useState("");
  const [booth, setBooth] = useState(null);
  const [activeTab, setActiveTab] = useState("qr"); // QR scanning is primary (1st), code is 2nd

  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [_error, setError] = useState("");
  const [pendingRequest, setPendingRequest] = useState(false);
  const [qrModalData, setQrModalData] = useState(null);
  const [showWebScanner, setShowWebScanner] = useState(false);

  useRegisterModal(Boolean(qrModalData), () => setQrModalData(null));
  useRegisterModal(showWebScanner, () => setShowWebScanner(false));
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const boothRef = useRef(null);
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
            const boothIdentifier = boothData.boothId || boothData.id;
            navigate(`/booth/${boothIdentifier}`);
            return;
          }

          setError("");
          setBooth(boothData);
        } else {
          setError("Invalid invite code");
          addToast("Invalid invite code", "error");
        }
      } catch (err) {
        const status = err.status || err.response?.status;
        let msg;
        if (status === 404) {
          msg = "Invite not found — please verify the code or link";
        } else {
          msg = err.message || "Invalid invite code";
        }

        try {
          addToast(msg, "error");
        } catch {
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
      if (isLoading) return;

      if (!isAuthenticated) {
        navigate(`/login?invite=${code}&redirect=/booth/join/${code}`);
        return;
      }

      setInviteCode(code.toUpperCase());
      checkInviteCode(code);
    }

    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessages = {
        invalid_code: "Invalid invite code",
        booth_full: "This booth is full and cannot accept more members",
        booth_inactive: "This booth is not currently active",
        domain_restricted: "Your email domain is not allowed to join this booth",
        join_failed: "Failed to join booth. Please try again.",
        server_error: "Server error occurred. Please try again later.",
      };
      const msg =
        errorMessages[errorParam] || "An error occurred while joining the booth";
      try {
        addToast(msg, "error");
      } catch {
        // ignore
      }
    }
  }, [code, searchParams, isLoading, isAuthenticated, navigate, addToast, checkInviteCode]);

  useEffect(() => {
    return () => {
      try {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
          copyTimeoutRef.current = null;
        }
      } catch {
        // ignore
      }
    };
  }, []);

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

      const response = await boothService.joinBooth(inviteCode || booth.inviteCode);

      if (response.success) {
        const msg = response.message || "";
        if (
          /pending/i.test(msg) ||
          (!response.boothId && booth?.settings?.requireApproval)
        ) {
          setPendingRequest(true);
          (async () => {
            try {
              if (!socketRef.current) {
                const mod = await import("socket.io-client");
                const ioClient = mod.io || mod.default || mod;
                const SOCKET_URL =
                  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? undefined : "http://localhost:5000");
                const token = localStorage.getItem("token");
                const socket = ioClient(SOCKET_URL, {
                  transports: ["websocket", "polling"],
                  auth: { token },
                });
                socketRef.current = socket;

                socket.on("joinRequest:status", async (payload) => {
                  try {
                    if (!payload) return;
                    const payloadBoothId = (payload.boothId || "").toString();
                    const currentBooth = boothRef.current;
                    const currentBoothId = (currentBooth?.id || "").toString();
                    if (!payloadBoothId || payloadBoothId !== currentBoothId)
                      return;

                    if (payload.status === "approved") {
                      addToast(
                        payload.message || "Your join request has been approved.",
                        "success",
                      );
                      try {
                        socketRef.current.disconnect();
                      } catch {
                        // ignore
                      }
                      socketRef.current = null;
                      navigate(`/booth/${payloadBoothId}`);
                    } else if (payload.status === "rejected") {
                      addToast(
                        payload.message || "Your join request has been rejected.",
                        "error",
                      );
                      setPendingRequest(false);
                      try {
                        socketRef.current.disconnect();
                      } catch {
                        // ignore
                      }
                      socketRef.current = null;
                    }
                  } catch (innerErr) {
                    console.error("Error handling joinRequest:status", innerErr);
                  }
                });
              }
            } catch (sockErr) {
              console.error("Failed to initialize socket for join requests", sockErr);
            }
          })();
          addToast(msg || "Join request submitted and is pending approval", "info");
        } else {
          const boothIdentifier = response.boothId || booth.boothId || booth.id;
          navigate(`/booth/${boothIdentifier}?joined=true`);
        }
      } else {
        addToast(response.error || "Failed to join booth", "error");
      }
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (
        status === 400 &&
        /not accepting|full|inactive/i.test(err.message || "")
      ) {
        setError("This booth is closed and is not accepting new members.");
        addToast("This booth is closed and is not accepting new members.", "error");
      } else if (status === 403) {
        setError(err.message || "You are not allowed to join this booth.");
        addToast(err.message || "You are not allowed to join this booth.", "error");
      } else {
        setError(err.message || "Failed to join booth");
        addToast(err.message || "Failed to join booth", "error");
      }
    } finally {
      setJoining(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `booth-${qrModalData?.inviteCode || "qr"}.png`;
      link.href = url;
      link.click();
      addToast("QR Code downloaded", "success");
    }
  };

  // Launch camera scan (Capacitor ML Kit native on Android/iOS, Web camera modal on web)
  const handleOpenCameraScan = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await scanQRCodeNative();
        if (res.success && res.code) {
          setInviteCode(res.code);
          addToast(`Detected booth code: ${res.code}`, "success");
          await checkInviteCode(res.code);
        } else if (res.invalidCode) {
          addToast("Scanned QR code does not match a valid VoteBooth invite.", "error");
        } else if (res.permissionDenied) {
          addToast("Camera permission denied. Please allow camera access in app settings.", "error");
        } else if (res.error) {
          addToast(res.error, "error");
        }
      } catch (err) {
        console.error("Native scan error:", err);
        addToast("Failed to launch camera scanner", "error");
      }
    } else {
      setShowWebScanner(true);
    }
  };

  // Web camera scan success
  const handleWebScanSuccess = async (scannedRaw) => {
    setShowWebScanner(false);
    const parsed = parseInviteCode(scannedRaw);
    if (parsed) {
      setInviteCode(parsed);
      addToast(`Detected booth code: ${parsed}`, "success");
      await checkInviteCode(parsed);
    } else {
      addToast("Scanned QR code is not a valid VoteBooth invite.", "error");
    }
  };

  // Gallery image picked & decoded
  const handleImageFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLoading(true);
    try {
      const res = await decodeQRFromImageFile(file);
      if (res.success && res.code) {
        setInviteCode(res.code);
        addToast(`Decoded invite code: ${res.code}`, "success");
        await checkInviteCode(res.code);
      } else if (res.invalidCode) {
        addToast("Image contains a QR code, but it is not a valid VoteBooth invite.", "error");
      } else if (res.noQRCodeFound) {
        addToast("No QR code detected in the selected image. Please try a clearer picture.", "warning");
      } else if (res.error) {
        addToast(res.error, "error");
      }
    } catch (err) {
      console.error("Gallery decode error:", err);
      addToast("Failed to decode QR code from image", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <div className="w-full max-w-lg mx-auto overflow-x-hidden px-4 pt-3 pb-28 sm:pb-12 animate-fadeIn relative">
      <AppWatermark variant="shield" />
      {/* ── STATE 1: ENTER CODE / SCAN QR (Matching Screen 1) ── */}
      {!booth ? (
        <div>
          {/* Top Header matching all pages */}
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallback="/dashboard" />
            <h1 className="text-xl font-bold theme-text">Join Booth</h1>
          </div>

          {/* Hero Banner with Phone + QR Graphic */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-accent-50/60 dark:bg-accent/10 border border-accent/20 mb-5 shadow-xs">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-extrabold theme-text tracking-tight mb-1">
                Join Booth
              </h2>
              <p className="text-xs theme-muted leading-relaxed">
                Enter a code or scan a QR to join a booth and start voting.
              </p>
            </div>
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white flex items-center justify-center shadow-md p-2">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="2" width="14" height="20" rx="3" />
                <path d="M8.5 6.5h2v2h-2zM13.5 6.5h2v2h-2zM8.5 11.5h2v2h-2zM13.5 11.5h2v2h-2z" strokeWidth="1.5" />
                <line x1="10" y1="18" x2="14" y2="18" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Pill-Style Tabs: QR first, Code second (separated, no common filled connection) */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`py-2.5 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === "qr"
                  ? "btn-theme text-on-primary shadow-sm"
                  : "theme-surface border border-border theme-muted hover:theme-text shadow-2xs"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Scan QR</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`py-2.5 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === "code"
                  ? "btn-theme text-on-primary shadow-sm"
                  : "theme-surface border border-border theme-muted hover:theme-text shadow-2xs"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Enter Code</span>
            </button>
          </div>

          {/* Hidden File Input for Gallery QR Scan */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFilePicked}
          />

          {/* TAB 1: Enter Code */}
          {activeTab === "code" && (
            <div className="theme-surface rounded-3xl border border-border p-6 shadow-sm mb-4 animate-fadeIn">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold theme-text mb-1">Enter Booth Code</h3>
                <p className="text-xs theme-muted">Type or paste the 6-8 character invite code below</p>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 8),
                      )
                    }
                    placeholder="e.g. VBBC1A"
                    maxLength={8}
                    className="w-full text-center text-2xl font-mono font-bold tracking-widest py-4 px-4 rounded-2xl border-2 border-border focus:border-accent bg-theme-surface theme-text focus:outline-none transition-all shadow-inner uppercase"
                    autoFocus
                  />
                  {inviteCode && (
                    <button
                      type="button"
                      onClick={() => setInviteCode("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:theme-text rounded-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || inviteCode.trim().length < 4}
                  className="w-full py-4 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <span>Checking Code...</span>
                    </>
                  ) : (
                    <span>Verify & Preview Booth</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Scan QR (Native Google ML Kit / Web Camera + Gallery) */}
          {activeTab === "qr" && (
            <div className="theme-surface rounded-3xl border border-border p-6 shadow-sm mb-4 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold theme-text mb-1">Scan a Booth QR Code</h3>
              <p className="text-xs theme-muted max-w-xs mx-auto mb-5 leading-relaxed">
                Scan with your camera or select a QR image to verify and join instantly.
              </p>

              <button
                type="button"
                onClick={handleOpenCameraScan}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                <span>{loading ? "Processing..." : "Open Camera"}</span>
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="px-3 text-[11px] theme-muted uppercase font-bold tracking-wider">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full p-3.5 rounded-2xl border border-border theme-surface hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold theme-text">Scan from Gallery</div>
                    <div className="text-[11px] theme-muted">Choose an image with a QR code</div>
                  </div>
                </div>
                <svg className="w-4 h-4 theme-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Clean Tip Card without emojis */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-accent/20 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
            <div className="w-5 h-5 rounded-md bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="leading-relaxed font-medium">You can also ask the booth admin for the invite code if you don't have a QR code.</span>
          </div>
        </div>
      ) : (
        /* ── STATE 2: BOOTH PREVIEW (Matching Screen 3 Mockup) ── */
        <div className="animate-fadeIn">
          {/* Top Header */}
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setBooth(null)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border theme-surface theme-text shadow-sm hover:bg-accent-50 active:scale-95 transition-all"
              aria-label="Back to code input"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold theme-text">Join Booth</h1>
          </div>

          {/* Booth Header Card */}
          <div className="theme-surface rounded-2xl border border-border p-4 mb-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                {/* Top Row: Title on Left, Status Badge & QR on Right */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h2 className="text-base font-bold theme-text truncate">{booth.name}</h2>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {booth.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-500/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-transparent text-rose-600 dark:text-rose-400 border border-rose-500/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Closed
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setQrModalData({
                          inviteCode: booth.inviteCode || inviteCode,
                          boothName: booth.name,
                          inviteLink: `${window.location.origin}/join/${booth.inviteCode || inviteCode}`,
                        })
                      }
                      className="w-7 h-7 rounded-lg border border-accent/20 text-accent hover:bg-accent-50 dark:hover:bg-accent/15 flex items-center justify-center transition-colors"
                      title="View QR Code"
                      aria-label="View QR Code"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Metadata Row: Creator on Left, Booth ID on Right */}
                <div className="flex items-center justify-between gap-2 text-xs theme-muted mb-2">
                  <span className="truncate">Created by {booth.creator?.name || "Booth Admin"}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-md border border-border uppercase tracking-wide">
                      ID {booth.boothId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(booth.boothId);
                        addToast("Booth ID copied", "success");
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-accent hover:bg-accent-50 dark:hover:bg-accent/15 transition-colors"
                      title="Copy Booth ID"
                      aria-label="Copy Booth ID"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {booth.description && (
                  <p className="text-xs theme-muted leading-relaxed">
                    {booth.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Specifications List Card */}
          <div className="theme-surface rounded-2xl border border-border p-4 mb-4 shadow-xs space-y-3 text-xs font-medium">
            <div className="flex items-center gap-3 theme-text">
              <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Candidates ({booth.candidates?.length || 0})</span>
            </div>
            <div className="flex items-center gap-3 theme-text">
              <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {booth.settings?.votingStartTime && booth.settings?.votingEndTime
                  ? `${new Date(booth.settings.votingStartTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(booth.settings.votingEndTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  : booth.createdAt
                    ? `Created ${new Date(booth.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : "Open Schedule"}
              </span>
            </div>
            <div className="flex items-center gap-3 theme-text">
              <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Max {booth.maxMembers || 100} Members</span>
            </div>
            <div className="flex items-center gap-3 theme-text">
              <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
                <circle cx="12" cy="12" r="3.5" fill="currentColor" strokeWidth={2} />
              </svg>
              <span>Single Choice</span>
            </div>
            <div className="flex items-center gap-3 theme-text">
              <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Created by {booth.creator?.name || "Booth Admin"}</span>
            </div>
          </div>

          {/* Candidates Section */}
          {booth.candidates && booth.candidates.length > 0 && (
            <div className="theme-surface rounded-2xl border border-border p-4 mb-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold theme-text">
                  Candidates ({booth.candidates.length})
                </h3>
              </div>
              <div className="space-y-2.5">
                {booth.candidates.map((candidate, idx) => {
                  const initial = candidate.name ? candidate.name.charAt(0).toUpperCase() : "C";
                  return (
                    <div key={candidate._id || candidate.id || idx} className="flex items-center gap-3 p-2.5 rounded-xl border border-border">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20">
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold theme-text truncate">{candidate.name}</div>
                        {candidate.description && (
                          <div className="text-[11px] theme-muted truncate">{candidate.description}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Approval notice if applicable */}
          {pendingRequest && (
            <div className="p-4 rounded-2xl bg-accent-50 dark:bg-accent/15 border border-accent/30 text-accent text-xs mb-4 text-center font-medium shadow-xs">
              Your request has been submitted and is awaiting approval from the organizer.
            </div>
          )}

          {/* Join CTA Button */}
          {booth.status === "active" ? (
            <button
              type="button"
              onClick={handleJoinBooth}
              disabled={joining}
              className="w-full py-4 rounded-2xl btn-theme text-on-primary font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>{joining ? "Joining Booth..." : "Join Booth"}</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-error/10 border border-error/20 text-center">
              <h4 className="text-sm font-bold text-error mb-1">This booth is closed</h4>
              <p className="text-xs theme-muted">
                The organizer has closed this booth and is not accepting new members.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Web Camera QR Scanner Modal */}
      <WebQRScannerModal
        isOpen={showWebScanner}
        onClose={() => setShowWebScanner(false)}
        onScanSuccess={handleWebScanSuccess}
        onError={(msg) => addToast(msg, "error")}
      />

      {/* QR Code Modal for sharing/viewing */}
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
  );
};

export default JoinBoothPage;
