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

    // 2. Android Deep Link handling for Google OAuth (votebooth://auth/callback?token=...)
    App.addListener("appUrlOpen", (event) => {
      if (event?.url && event.url.includes("auth/callback")) {
        try {
          const queryIndex = event.url.indexOf("?");
          const search = queryIndex !== -1 ? event.url.slice(queryIndex) : "";
          if (navigate) {
            navigate(`/auth/callback${search}`, { replace: true });
          } else {
            window.location.href = `/auth/callback${search}`;
          }
        } catch (err) {
          console.error("Failed to route OAuth callback deep link:", err);
        }
      }
    });
  }
}

