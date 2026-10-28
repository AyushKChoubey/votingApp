import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// LIFO stack of active modal/drawer close callbacks
const modalCloseStack = [];

/**
 * Register a close handler for an open modal, drawer, or bottom sheet.
 * Returns an unregister function to call when the modal closes or unmounts.
 */
export function registerModalClose(closeFn) {
  if (typeof closeFn !== "function") return () => {};
  modalCloseStack.push(closeFn);
  return () => {
    const idx = modalCloseStack.lastIndexOf(closeFn);
    if (idx !== -1) {
      modalCloseStack.splice(idx, 1);
    }
  };
}

/**
 * Parses deep link URLs into internal client router paths.
 * Supports custom schemes (votebooth://) and web URLs.
 * @param {string} rawUrl - The incoming deep link URL
 * @returns {string|null} - The application route or null if unrecognized
 */
export function parseDeepLink(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  // 1. Android Deep Link handling for Google OAuth (votebooth://auth/callback?token=...)
  if (rawUrl.includes("auth/callback")) {
    const queryIndex = rawUrl.indexOf("?");
    const search = queryIndex !== -1 ? rawUrl.slice(queryIndex) : "";
    return `/auth/callback${search}`;
  }

  // 2. Custom scheme join link: votebooth://join/:code or votebooth://booth/join/:code
  const joinMatch = rawUrl.match(/votebooth:\/\/(?:booth\/)?join\/([A-Za-z0-9_-]+)/i);
  if (joinMatch) {
    const code = joinMatch[1].toUpperCase();
    const queryIndex = rawUrl.indexOf("?");
    const search = queryIndex !== -1 ? rawUrl.slice(queryIndex) : "";
    return `/booth/join/${code}${search}`;
  }

  // 3. Custom scheme direct booth view: votebooth://booth/:id or votebooth://b/:id
  const boothMatch = rawUrl.match(/votebooth:\/\/(?:booth|b)\/([A-Za-z0-9_-]+)/i);
  if (boothMatch) {
    const boothId = boothMatch[1];
    const queryIndex = rawUrl.indexOf("?");
    const search = queryIndex !== -1 ? rawUrl.slice(queryIndex) : "";
    return `/booth/${boothId}${search}`;
  }

  // 4. Universal / App Links: https://.../join/:code or /booth/join/:code
  try {
    const parsed = new URL(rawUrl);
    if (parsed.pathname.startsWith("/join/")) {
      const code = parsed.pathname.replace("/join/", "").split("/")[0].toUpperCase();
      return `/booth/join/${code}${parsed.search}`;
    }
    if (parsed.pathname.startsWith("/booth/join/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
    if (parsed.pathname.startsWith("/booth/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch (e) {}

  return null;
}

let isInitialized = false;

/**
 * Initializes Android hardware back button and deep link listeners.
 * @param {Function} navigate - React Router navigate function
 */
export function initBackHandler(navigate) {
  if (isInitialized) return;
  isInitialized = true;

  if (Capacitor.isNativePlatform()) {
    // 1. Android Back Button Handling
    App.addListener("backButton", ({ canGoBack }) => {
      // Step A: If the virtual keyboard is open or any input is focused, dismiss it first
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.isContentEditable)
      ) {
        activeEl.blur();
        return;
      }

      // Step B: If any overlay (modal, drawer, bottom sheet) is open, close the topmost one
      if (modalCloseStack.length > 0) {
        const closeTop = modalCloseStack.pop();
        if (typeof closeTop === "function") {
          try {
            closeTop();
          } catch (e) {
            console.error("Error executing modal close handler:", e);
          }
          return;
        }
      }

      // Step C: Route back if history permits and not at app root
      const currentPath = window.location.pathname;
      const isRoot = currentPath === "/" || currentPath === "/dashboard";

      if (canGoBack && !isRoot) {
        if (navigate) {
          navigate(-1);
        } else {
          window.history.back();
        }
      } else {
        // At root or cannot go back: exit application
        App.exitApp();
      }
    });

    // 2. Android Deep Link handling (OAuth, Booth Join, Booth Detail)
    App.addListener("appUrlOpen", (event) => {
      if (event?.url) {
        try {
          const targetRoute = parseDeepLink(event.url);
          if (targetRoute) {
            if (navigate) {
              navigate(targetRoute, { replace: true });
            } else {
              window.location.href = targetRoute;
            }
          }
        } catch (err) {
          console.error("Failed to route deep link:", err);
        }
      }
    });
  }
}
