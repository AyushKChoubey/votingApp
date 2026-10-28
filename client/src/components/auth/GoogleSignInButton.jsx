import React, { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { GoogleIcon } from "../icons/Icons";

const GoogleSignInButton = ({ text = "Continue with Google" }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Get the API base URL from environment or default to localhost
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "" : "http://localhost:5000");

      // Preserve any `redirect` query parameter from the current URL so the
      // OAuth flow can return the user to their intended destination (e.g. joining a booth).
      const params = new URLSearchParams(window.location.search);
      let redirectParam = params.get("redirect");
      const inviteParam = params.get("invite");

      // If an invite code is present but no explicit redirect, construct join destination
      if (!redirectParam && inviteParam) {
        redirectParam = `/booth/join/${encodeURIComponent(inviteParam.toUpperCase())}`;
      }

      const redirectQuery = redirectParam
        ? `?redirect=${encodeURIComponent(redirectParam)}`
        : "";

      const isNativeApp =
        Capacitor.isNativePlatform() ||
        window.location.protocol === "capacitor:" ||
        (window.location.protocol === "https:" &&
          window.location.hostname === "localhost" &&
          !window.location.port);
      const mobileQuery = isNativeApp ? "&mobile=1" : "";
      const separator = redirectQuery ? "&" : "?";

      const targetUrl = `${API_BASE_URL}/api/auth/google${redirectQuery}${mobileQuery ? `${separator}${mobileQuery.slice(1)}` : ""}`;

      // On native mobile devices (Android / iOS), open in Chrome Custom Tabs / system browser
      // so the browser has direct access to all Google accounts already signed in on the device.
      if (Capacitor.isNativePlatform()) {
        try {
          await Browser.open({
            url: targetUrl,
            windowName: "_self",
          });
        } catch (err) {
          console.warn("Capacitor Browser open failed, falling back to window.location.href:", err);
          window.location.href = targetUrl;
        }
      } else {
        window.location.href = targetUrl;
      }
    } finally {
      // Release loading flag after a short delay so the button remains responsive if user cancels
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 glass-card border-2 border-border rounded-xl hover:border-accent theme-text font-medium transition-all duration-300 interactive-scale focus-ring group disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <GoogleIcon className="text-2xl" />
      <span className="group-hover:text-accent transition-colors">
        {loading ? "Connecting to Google..." : text}
      </span>
    </button>
  );
};

export default GoogleSignInButton;
