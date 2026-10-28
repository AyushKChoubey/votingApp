/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useContext } from "react";
import { sileo, Toaster } from "sileo";
import "sileo/styles.css";
import { ThemeContext } from "../../context/ThemeContext";

/**
 * Normalizes message input into a structured payload for Sileo.
 * When a message is short (<= 26 chars), it renders as a sleek single-line pill.
 * When a message is longer or multiline, it parses a concise header and full description
 * so Sileo smoothly morphs into its spacious card container without any text truncation or spillover.
 */
export function parseToastContent(message, type = "success") {
  const normType = type === "danger" ? "error" : (type || "info");
  const defaultHeaders = {
    success: "Success",
    error: "Error",
    warning: "Notice",
    info: "Information",
  };

  if (typeof message === "object" && message !== null) {
    return {
      title: message.title || defaultHeaders[normType] || "Notification",
      description: message.description || message.message || undefined,
      duration: message.duration,
      id: message.id,
    };
  }

  if (typeof message !== "string") {
    return {
      title: defaultHeaders[normType] || "Notification",
      description: undefined,
    };
  }

  const str = message.trim();
  if (!str) {
    return {
      title: defaultHeaders[normType] || "Notification",
      description: undefined,
    };
  }

  // Short single-sentence or status phrase (<= 26 characters) without line breaks:
  // Render as sleek single-line pill.
  if (str.length <= 26 && !str.includes("\n")) {
    return {
      title: str,
      description: undefined,
    };
  }

  // 1. Line breaks (first line as title, rest as description)
  if (str.includes("\n")) {
    const parts = str.split("\n").map((s) => s.trim()).filter(Boolean);
    return {
      title: parts[0] || defaultHeaders[normType],
      description: parts.slice(1).join(" ") || undefined,
    };
  }

  // 2. Colon separator (e.g., 'Failed to update: Network request timed out')
  const colonIdx = str.indexOf(":");
  if (colonIdx > 0 && colonIdx <= 30) {
    const rawDesc = str.slice(colonIdx + 1).trim();
    return {
      title: str.slice(0, colonIdx).trim(),
      description: rawDesc ? rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1) : undefined,
    };
  }

  // 3. Dash / Em-dash separator (e.g., 'Candidate editing is locked — votes already exist')
  const dashMatch = str.match(/^(.*?)\s+(?:—|--|-)\s+(.*)$/);
  if (dashMatch && dashMatch[1].length <= 32) {
    const rawDesc = dashMatch[2].trim();
    return {
      title: dashMatch[1].trim(),
      description: rawDesc ? rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1) : undefined,
    };
  }

  // 4. Multiple sentences (period followed by space, e.g. 'Camera permission denied. Please allow camera access in app settings.')
  const periodIdx = str.indexOf(". ");
  if (periodIdx > 0 && periodIdx <= 32) {
    return {
      title: str.slice(0, periodIdx).trim(),
      description: str.slice(periodIdx + 2).trim(),
    };
  }

  // 5. Common VoteBooth key phrases: give them clean specific titles
  const lower = str.toLowerCase();
  if (lower.includes("invite link") || lower.includes("invitation link")) {
    return { title: "Invite Link", description: str };
  }
  if (lower.includes("invite code")) {
    return { title: "Invite Code", description: str };
  }
  if (lower.includes("qr code")) {
    return { title: "QR Code", description: str };
  }
  if (lower.includes("vote has been recorded") || lower.includes("vote recorded")) {
    return { title: "Vote Recorded", description: str };
  }
  if (lower.includes("booth is closed") || lower.includes("booth closed")) {
    return { title: "Booth Closed", description: str };
  }
  if (lower.includes("candidate editing is locked") || lower.includes("editing is locked")) {
    return { title: "Editing Locked", description: str };
  }
  if (lower.includes("camera permission")) {
    return { title: "Camera Permission", description: str };
  }
  if (lower.includes("password changed")) {
    return { title: "Password Changed", description: str };
  }
  if (lower.includes("profile updated")) {
    return { title: "Profile Updated", description: str };
  }
  if (lower.includes("settings updated")) {
    return { title: "Settings Updated", description: str };
  }

  // 6. Common prefix: 'Failed to...', 'Unable to...', 'Cannot...'
  const verbMatch = str.match(/^(failed to|unable to|cannot)\s+([^.]+)/i);
  if (verbMatch && verbMatch[2].length <= 26) {
    const verb = verbMatch[1].toLowerCase() === "cannot" ? "Cannot" : "Failed to";
    const action = verbMatch[2].trim();
    return {
      title: `${verb} ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      description: str,
    };
  }

  // 7. General fallback: standard type title + full message in description
  return {
    title: defaultHeaders[normType] || "Notification",
    description: str,
  };
}

/**
 * Global Sileo Toast Adapter
 * Provides direct access to Sileo's official API while maintaining
 * drop-in compatibility for existing useToast callers across VoteBooth.
 */
export const addToast = (message, type = "success", duration) => {
  const normType = type === "danger" ? "error" : (type || "info");
  const parsed = parseToastContent(message, normType);

  const finalDuration = duration || (parsed.description ? 4200 : 3200);

  const payload = {
    id: parsed.id || Math.random().toString(36).substring(2, 9),
    title: parsed.title,
    description: parsed.description,
    duration: finalDuration,
    autopilot: parsed.description
      ? { expand: 0, collapse: finalDuration + 1000 }
      : undefined,
  };

  if (typeof sileo[normType] === "function") {
    return sileo[normType](payload);
  }
  return sileo.show(payload);
};

export const removeToast = (id) => {
  if (id) {
    sileo.dismiss(id);
  } else {
    sileo.clear();
  }
};

export const useToast = () => ({
  addToast,
  removeToast,
  sileo,
});

export { sileo, Toaster };

export function ToastProvider({ children }) {
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext ? themeContext.isDark : (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark");

  // Sileo's built-in theme fill renders #1a1a1a (dark) when theme="light", and #f2f2f2 (light) when theme="dark".
  // Therefore, passing isDark ? "dark" : "light" renders a light toast in dark mode and a dark toast in light mode.
  const toastTheme = isDark ? "dark" : "light";

  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toastPosition = isMobile ? "top-center" : "top-right";

  return (
    <>
      {children}
      <Toaster
        position={toastPosition}
        theme={toastTheme}
        offset={
          isMobile
            ? { top: "calc(16px + env(safe-area-inset-top, 0px))" }
            : {
                top: "calc(16px + env(safe-area-inset-top, 0px))",
                right: "calc(16px + env(safe-area-inset-right, 0px))",
              }
        }
        options={{
          duration: 3500,
          styles: {
            title: "font-semibold text-sm",
            description: "text-xs opacity-90",
          },
        }}
      />
    </>
  );
}

export default useToast;
