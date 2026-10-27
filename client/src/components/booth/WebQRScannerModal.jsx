import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { useRegisterModal } from "../../hooks/useRegisterModal";

export function WebQRScannerModal({ isOpen, onClose, onScanSuccess, onError }) {
  useRegisterModal(isOpen, onClose);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null); // null | true | false
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const [isScanning, setIsScanning] = useState(true);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Frame processing loop with jsQR
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !isScanning) return;
    const video = videoRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          setIsScanning(false);
          stopCamera();
          onScanSuccess(code.data);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [isScanning, onScanSuccess, stopCamera]);

  // Start camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setIsScanning(true);
    setHasPermission(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasPermission(false);
        onError?.("Camera access is not supported by your browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setHasPermission(true);
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.warn("Camera start failed:", err);
      setHasPermission(false);
      onError?.(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Please allow camera access in your browser settings."
          : "Could not start camera. Please verify camera is connected."
      );
    }
  }, [facingMode, onError, scanFrame, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Header bar */}
      <div className="w-full max-w-md flex items-center justify-between text-white pt-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">Scan Booth QR Code</h3>
            <p className="text-[11px] text-slate-300">Align QR code inside the frame</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Flip camera button */}
          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Switch Camera"
            aria-label="Switch Camera"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Close Scanner"
            aria-label="Close Scanner"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Viewfinder Area */}
      <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden border-2 border-cyan-500/30 bg-black flex items-center justify-center shadow-2xl">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Viewfinder Target Box with Corner Brackets */}
        <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
          {/* Top-left corner */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
          {/* Top-right corner */}
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
          {/* Bottom-left corner */}
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
          {/* Bottom-right corner */}
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />

          {/* Animated scanning laser line */}
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_12px_#06b6d4]" />
        </div>

        {/* Permission Denied state */}
        {hasPermission === false && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-white text-sm font-bold mb-1">Camera Permission Needed</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Please allow camera access in your browser to scan QR codes.
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 rounded-xl btn-theme text-on-primary text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="w-full max-w-md text-center text-xs text-slate-300 pb-4">
        <p className="mb-2">Point your camera steadily at any VoteBooth QR code.</p>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="text-cyan-400 hover:underline font-medium text-xs"
        >
          Cancel and enter code manually
        </button>
      </div>
    </div>
  );
}

