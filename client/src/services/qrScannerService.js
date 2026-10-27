import { BarcodeScanner, BarcodeFormat } from "@capacitor-mlkit/barcode-scanning";
import { Capacitor } from "@capacitor/core";
import jsQR from "jsqr";

/**
 * Parses and extracts a valid VoteBooth invite code from raw scanned text or URL.
 * Accepts:
 *  - Raw 4-10 character alphanumeric code: "28AD6T"
 *  - VoteBooth URL: "https://votebooth.app/join/28AD6T"
 *  - App URL: "http://localhost:5173/join/28AD6T"
 *  - Custom scheme: "votebooth://join/28AD6T"
 *  - Query param: "?code=28AD6T"
 */
export function parseInviteCode(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();

  // 1. Direct code (4-10 uppercase alphanumeric characters)
  if (/^[A-Za-z0-9]{4,10}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // 2. Try URL parsing
  try {
    const url = new URL(trimmed);
    const joinMatch = url.pathname.match(/\/(?:booth\/)?join\/([A-Za-z0-9]{4,10})/i);
    if (joinMatch && joinMatch[1]) {
      return joinMatch[1].toUpperCase();
    }
    const codeParam = url.searchParams.get("code");
    if (codeParam && /^[A-Za-z0-9]{4,10}$/.test(codeParam)) {
      return codeParam.toUpperCase();
    }
  } catch {
    // Non-standard URL, fallback to regex
    const match = trimmed.match(/join\/([A-Za-z0-9]{4,10})/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Scans a QR code on native Android/iOS using Capacitor ML Kit Barcode Scanner.
 * Returns:
 *  { success: true, code: "28AD6T", raw: "..." }
 *  { canceled: true }
 *  { permissionDenied: true }
 *  { invalidCode: true, raw: "..." }
 *  { error: string }
 */
export async function scanQRCodeNative() {
  if (!Capacitor.isNativePlatform()) {
    return { isWeb: true };
  }

  try {
    // 1. Check if Google Barcode Scanner Module is available on Android
    if (Capacitor.getPlatform() === "android") {
      try {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!available) {
          await BarcodeScanner.installGoogleBarcodeScannerModule();
        }
      } catch (err) {
        console.warn("Google Barcode Scanner Module check failed:", err);
      }
    }

    // 2. Try single-shot scan UI (Google Code Scanner on Android, native UI on iOS)
    try {
      const result = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });

      if (result.barcodes && result.barcodes.length > 0) {
        const raw = result.barcodes[0].displayValue || result.barcodes[0].rawValue || "";
        const code = parseInviteCode(raw);
        if (code) {
          return { success: true, code, raw };
        }
        return { invalidCode: true, raw };
      }
      return { canceled: true };
    } catch (scanErr) {
      // Check for user cancellation
      const msg = scanErr?.message || "";
      if (
        msg.includes("canceled") ||
        msg.includes("cancelled") ||
        msg.includes("User canceled") ||
        scanErr?.code === "1"
      ) {
        return { canceled: true };
      }

      // If Google Code Scanner is not available, fallback to camera permission flow
      console.warn("BarcodeScanner.scan failed, falling back to camera permission scan:", scanErr);
    }

    // 3. Fallback: Request Camera Permissions
    const { camera } = await BarcodeScanner.requestPermissions();
    if (camera !== "granted") {
      return { permissionDenied: true };
    }

    // Hide webview background and start scanning
    document.querySelector("body")?.classList.add("barcode-scanner-active");

    const listener = await BarcodeScanner.addListener("barcodeScanned", async () => {
      await BarcodeScanner.stopScan();
      document.querySelector("body")?.classList.remove("barcode-scanner-active");
      await listener.remove();
    });

    await BarcodeScanner.startScan({ formats: [BarcodeFormat.QrCode] });
    return { runningCustomScan: true };
  } catch (err) {
    document.querySelector("body")?.classList.remove("barcode-scanner-active");
    console.error("Native QR scan error:", err);
    return { error: err.message || "Failed to start camera scanner" };
  }
}

/**
 * Decodes a QR code from an image file (File or Blob) using jsQR.
 * Works universally on web and native.
 */
export async function decodeQRFromImageFile(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ error: "No file selected" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ error: "Canvas context not supported" });
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (decoded && decoded.data) {
            const raw = decoded.data;
            const code = parseInviteCode(raw);
            if (code) {
              resolve({ success: true, code, raw });
            } else {
              resolve({ invalidCode: true, raw });
            }
          } else {
            resolve({ noQRCodeFound: true });
          }
        } catch (err) {
          resolve({ error: err.message || "Failed to process image" });
        }
      };
      img.onerror = () => resolve({ error: "Failed to load image file" });
      img.src = e.target.result;
    };
    reader.onerror = () => resolve({ error: "Failed to read file" });
    reader.readAsDataURL(file);
  });
}

