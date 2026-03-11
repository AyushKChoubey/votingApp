import { useEffect, useRef, useState, useCallback } from "react";

export function QRCodeModal({ data, onClose, onDownload }) {
  const canvasRef = useRef(null);
  const modalRef = useRef(null);
  const [copied, setCopied] = useState(null); // 'code' | 'link' | null
  const [isGenerating, setIsGenerating] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Generate QR code — load the qrcode library only when needed
  useEffect(() => {
    if (canvasRef.current && data) {
      setIsGenerating(true);
      import("qrcode")
        .then(({ default: QRCode }) => {
          QRCode.toCanvas(
            canvasRef.current,
            data.inviteLink,
            {
              width: 200,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
              errorCorrectionLevel: "H",
            },
            (error) => {
              if (error) console.error("QR Code generation error:", error);
              setIsGenerating(false);
            },
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

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  // Handle download with feedback
  const handleDownload = useCallback(() => {
    onDownload();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  }, [onDownload]);

  // Share functionality (if supported)
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${data?.boothName}`,
          text: `Join my voting booth using code: ${data?.inviteCode}`,
          url: data?.inviteLink,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }
  }, [data]);

  const canShare = typeof navigator !== "undefined" && navigator.share;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-sm glass-card rounded-2xl border border-white/20 shadow-2xl overflow-hidden animate-slideUp max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all hover:rotate-90 duration-300"
          aria-label="Close modal"
        >
          <svg
            className="w-4 h-4 theme-text"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="p-5">
          {/* Header - Compact */}
          <div className="text-center mb-4">
            <h3
              id="qr-modal-title"
              className="text-lg font-bold theme-text mb-0.5 pr-8"
            >
              {data?.boothName}
            </h3>
            <p className="text-xs theme-muted">Scan QR or use invite code</p>
          </div>

          {/* QR Code Container - Compact */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="relative p-4 theme-surface rounded-xl shadow-md border border-border">
                {isGenerating && (
                  <div className="absolute inset-0 flex items-center justify-center theme-surface rounded-xl">
                    <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  </div>
                )}
                <div className="p-2 bg-white/0 dark:bg-transparent rounded">
                  <canvas
                    ref={canvasRef}
                    id="qr-code-canvas"
                    className="w-48 h-48 sm:w-56 sm:h-56 rounded bg-transparent"
                  />
                </div>
              </div>
              {/* Corner decorations - subtle in light mode */}
              <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-accent/40 rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-accent/40 rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-accent/40 rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-accent/40 rounded-br-lg" />
            </div>
          </div>

          {/* Invite Code Section - Compact */}
          <button
            onClick={() => copyToClipboard(data?.inviteCode, "code")}
            className="w-full group flex items-center justify-between gap-2 px-4 py-3 rounded-xl theme-surface border border-border hover:border-accent/40 transition-all duration-200 mb-3"
          >
            <div className="text-left">
              <div className="text-[10px] theme-muted font-semibold uppercase tracking-wider mb-0.5">
                Invite Code
              </div>
              <span className="text-xl font-bold theme-text font-mono tracking-widest">
                {data?.inviteCode}
              </span>
            </div>
            <div
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied === "code"
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700"
                  : "bg-accent/10 text-accent group-hover:bg-accent/20"
              }`}
            >
              {" "}
              {copied === "code" ? (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </div>
          </button>

          {/* Invite Link - Compact */}
          <button
            onClick={() => copyToClipboard(data?.inviteLink, "link")}
            className="w-full group flex items-center gap-2 px-3 py-2.5 rounded-lg theme-surface border border-border hover:border-accent/40 transition-all mb-4"
          >
            <svg
              className="w-4 h-4 text-accent flex-shrink-0"
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
            <span className="flex-1 text-left text-xs theme-muted truncate group-hover:text-accent transition-colors">
              {data?.inviteLink}
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-1 rounded transition-colors flex-shrink-0 ${
                copied === "link"
                  ? "bg-green-50 text-green-700 dark:text-green-300 border border-green-100"
                  : "text-accent group-hover:bg-accent/10"
              }`}
            >
              {copied === "link" ? "Copied!" : "Copy"}
            </span>
          </button>

          {/* Action Buttons - Compact */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                downloadSuccess
                  ? "bg-green-600 text-white"
                  : "bg-accent text-white shadow-md hover:brightness-95"
              }`}
            >
              {downloadSuccess ? (
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
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Done!
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </>
              )}
            </button>

            {canShare && (
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl theme-surface border border-border hover:border-accent/50 font-medium text-sm theme-text transition-all duration-200"
                aria-label="Share booth"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
