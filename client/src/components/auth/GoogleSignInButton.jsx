import React from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleIcon } from "../icons/Icons";

const GoogleSignInButton = ({ text = "Continue with Google" }) => {
  const handleGoogleSignIn = () => {
    // Get the API base URL from environment or default to localhost
    const API_BASE_URL =
      import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "" : "http://localhost:5000");

    // Preserve any `redirect` query parameter from the current URL so the
    // OAuth flow can return the user to their intended destination.
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get("redirect");
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

    // Redirect to backend OAuth endpoint with optional redirect info
    window.location.href = `${API_BASE_URL}/api/auth/google${redirectQuery}${mobileQuery ? `${separator}${mobileQuery.slice(1)}` : ""}`;
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 glass-card border-2 border-border rounded-xl hover:border-accent theme-text font-medium transition-all duration-300 interactive-scale focus-ring group"
    >
      <GoogleIcon className="text-2xl" />
      <span className="group-hover:text-accent transition-colors">{text}</span>
    </button>
  );
};

export default GoogleSignInButton;
