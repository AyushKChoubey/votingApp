/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useContext } from "react";
import { sileo, Toaster } from "sileo";
import "sileo/styles.css";
import { ThemeContext } from "../../context/ThemeContext";

/**
 * Global Sileo Toast Adapter
 * Provides direct access to Sileo's official API while maintaining
 * drop-in compatibility for existing useToast callers across VoteBooth.
 */
export const addToast = (message, type = "success", duration = 3500) => {
  const normType = type === "danger" ? "error" : (type || "info");
  const title = typeof message === "string" ? message : (message?.title || "Notification");
  const description = typeof message === "object" ? message?.description : undefined;

  if (typeof sileo[normType] === "function") {
    return sileo[normType]({
      title,
      description,
      duration: duration || 3500,
    });
  }
  return sileo.show({
    title,
    description,
    duration: duration || 3500,
  });
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
