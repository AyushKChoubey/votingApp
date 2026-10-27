import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * Native-feeling Pull-to-Refresh interaction component for mobile Capacitor and Web.
 * Renders a subtle floating indicator at the top when pulled and calls `onRefresh`.
 */
export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className = "",
}) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef(null);

  const THRESHOLD = 65; // Pull distance in px required to trigger refresh
  const MAX_PULL = 90;

  const handleTouchStart = useCallback(
    (e) => {
      if (disabled || isRefreshing) return;
      const touch = e.touches[0];
      touchStartY.current = touch.clientY;
      touchStartX.current = touch.clientX;

      // Only allow pulling down if at top of scroll
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        containerRef.current?.scrollTop ||
        0;

      if (scrollTop <= 2) {
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    },
    [disabled, isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!isPullingRef.current || disabled || isRefreshing) return;
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartY.current;
      const deltaX = touch.clientX - touchStartX.current;

      // If user is swiping horizontally or scrolling up, do not trigger pull-to-refresh
      if (deltaY < 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
        isPullingRef.current = false;
        setPullY(0);
        return;
      }

      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        containerRef.current?.scrollTop ||
        0;

      if (scrollTop <= 2 && deltaY > 0) {
        // Damped pull distance
        const damped = Math.min(MAX_PULL, deltaY * 0.45);
        setPullY(damped);
      } else {
        setPullY(0);
      }
    },
    [disabled, isRefreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || disabled || isRefreshing) return;
    isPullingRef.current = false;

    if (pullY >= THRESHOLD && typeof onRefresh === "function") {
      setIsRefreshing(true);
      setPullY(THRESHOLD); // Hold position while refreshing
      try {
        await Promise.resolve(onRefresh());
      } catch (err) {
        console.error("Pull-to-refresh failed:", err);
      } finally {
        setIsRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  }, [disabled, isRefreshing, onRefresh, pullY]);

  useEffect(() => {
    const el = containerRef.current || window;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      {/* Pull / Refresh Indicator: Modern centered circular icon button without text */}
      {(pullY > 0 || isRefreshing) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[60] pointer-events-none transition-all duration-150 ease-out"
          style={{
            top: `calc(env(safe-area-inset-top, 0px) + ${Math.max(16, pullY)}px)`,
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 shadow-md flex items-center justify-center">
            <svg
              className={`w-5 h-5 ${
                isRefreshing ? "animate-spin" : ""
              }`}
              style={{
                transform: isRefreshing
                  ? undefined
                  : `rotate(${(pullY / THRESHOLD) * 270}deg)`,
                transition: isRefreshing ? "none" : "transform 0.1s linear",
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

