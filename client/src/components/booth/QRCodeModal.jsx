import { useEffect, useRef, useState, useCallback } from "react";
import { addToast } from "../layout/Toast";
import { shareBooth } from "../../services/shareService";
import { useRegisterModal } from "../../hooks/useRegisterModal";

export function QRCodeModal({ data, onClose, onDownload }) {
  useRegisterModal(Boolean(data), onClose);
  const canvasRef = useRef(null);
  const modalRef = useRef(null);
  const [copied, setCopied] = useState(null); // 'code' | 'link' | null
  const [isGenerating, setIsGenerating] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Generate clean QR code — NO center logo
  useEffect(() => {
    if (canvasRef.current && data) {
      setIsGenerating(true);
      import("qrcode")
        .then(({ default: QRCode }) => {
          QRCode.toCanvas(
            canvasRef.current,
            data.inviteLink || `${window.location.origin}/booth/join/${data.inviteCode}`,
            {
              width: 220,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
              errorCorrectionLevel: "H",
            },
            (error) => {
              if (error) {
                console.error("QR Code generation error:", error);
              }
              setIsGenerating(false);
            }
          );
        })
        .catch((err) => {
          console.error("Failed to load qrcode library:", err);
          setIsGenerating(false);
        });
    }
  }, [data]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  // Copy to clipboard with exact toasts from Image 2
  const copyToClipboard = useCallback(async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      if (type === "code") {
        addToast(
          {
            title: "Invite code copied",
            description: `Code ${data?.inviteCode || text} copied to clipboard.`,
          },
          "success"
        );
      } else {
        addToast(
          {
            title: "Link copied",
            description: "Invite link copied to clipboard.",
          },
          "success"
        );
      }
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      addToast(
        {
          title: "Couldn't copy",
          description: "Please try again.",
        },
        "danger"
      );
    }
  }, [data]);

  // Handle download with feedback
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    }
  }, [onDownload]);

  // Share functionality (Capacitor Native Android + Web Share)
  const handleShare = useCallback(async () => {
    try {
      const res = await shareBooth({
        boothName: data?.boothName,
        inviteCode: data?.inviteCode,
        inviteLink: data?.inviteLink,
      });
      if (res?.method === "clipboard") {
        addToast(
          {
            title: "Link copied",
            description: "Invite link copied to clipboard.",
          },
          "success"
        );
      }
    } catch (err) {
      console.error("Share failed:", err);
      copyToClipboard(data?.inviteLink, "link");
    }
  }, [data, copyToClipboard]);

  const canShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  const formattedCode = data?.inviteCode
    ? String(data.inviteCode).toUpperCase()
    : "";

  const displayLink = data?.inviteLink
    ? data.inviteLink.replace(/^https?:\/\//, "")
    : `votebooth.app/booth/join/${formattedCode}`;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-md theme-surface rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 animate-slideUp overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-border transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title & Subtitle */}
        <div className="text-center pt-1 mb-5">
          <h3 id="qr-modal-title" className="text-xl font-bold theme-text tracking-tight pr-6 pl-6">
            {data?.boothName || "Voting Booth"}
          </h3>
          <p className="text-xs sm:text-sm theme-muted mt-1 font-normal">
            Scan the QR code or share the invite code
          </p>
        </div>

        {/* QR Code Container with subtle cyan glow (Clean QR, NO center logo) */}
        <div className="flex justify-center mb-5">
          <div className="relative p-4 rounded-2xl bg-white shadow-[0_0_28px_rgba(6,182,212,0.18)] dark:shadow-[0_0_32px_rgba(6,182,212,0.22)] border border-cyan-400/30 flex items-center justify-center">
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                <div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              id="qr-code-canvas"
              className="w-48 h-48 sm:w-52 sm:h-52 rounded"
            />
          </div>
        </div>

        {/* Invite Code Box */}
        <div className="rounded-2xl p-3.5 bg-transparent border border-border flex items-center justify-between mb-3">
          <div>
            <div className="text-xs theme-muted font-medium mb-0.5">Invite code</div>
            <div className="text-2xl font-bold font-mono theme-text tracking-[0.25em]">
              {formattedCode}
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(data?.inviteCode, "code")}
            className="px-3.5 py-1.5 rounded-xl border border-border hover:border-accent bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 theme-text text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copied === "code" ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Link Box */}
        <div className="rounded-2xl px-3.5 py-2.5 bg-transparent border border-border flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-xs sm:text-sm theme-text font-medium truncate">
              {displayLink}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(data?.inviteLink, "link")}
            className="px-3 py-1.5 rounded-xl border border-border hover:border-accent bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 theme-text text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copied === "link" ? "Copied" : "Copy link"}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 btn-theme text-on-primary font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm hover:opacity-95 active:scale-95 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{downloadSuccess ? "Downloaded!" : "Download QR"}</span>
          </button>

          {canShare ? (
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 border border-slate-300 dark:border-slate-700 hover:border-accent hover:bg-slate-100 dark:hover:bg-slate-800 theme-text font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => copyToClipboard(data?.inviteLink, "link")}
              className="flex-1 border border-slate-300 dark:border-slate-700 hover:border-accent hover:bg-slate-100 dark:hover:bg-slate-800 theme-text font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Copy link</span>
            </button>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-xs theme-muted text-center mt-4">
          Anyone with this code can join your booth.
        </p>
      </div>
    </div>
  );
}

export default QRCodeModal;
