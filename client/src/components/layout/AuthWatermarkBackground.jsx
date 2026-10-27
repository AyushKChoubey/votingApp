import React from "react";

/**
 * Modern App Watermark & Background Ambient Graphics
 * Supports 3 distinctive variants (clean, fluid curves and meshes without dots):
 * 1. "waves" — Fluid curves, mesh orbs & smooth crest contours (Auth, Onboarding, Home)
 * 2. "shield" — Geometric voting shield, angled contour lines & crest badge (Dashboard, Booth pages)
 * 3. "grid" — Architectural subtle line grid & ambient radial bloom (Settings, Profile, Info pages)
 */
export const AppWatermark = ({ variant = "waves", className = "" }) => {
  if (variant === "shield") {
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
        {/* Ambient glow orbs */}
        <div className="absolute top-0 right-1/4 w-[420px] h-[420px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 w-[360px] h-[360px] rounded-full bg-sky-500/10 dark:bg-sky-500/5 blur-3xl pointer-events-none" />

        {/* Top-Right Geometric Vote Shield Outline & Contours */}
        <svg
          className="absolute -top-12 -right-12 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] opacity-40 dark:opacity-20 transition-opacity duration-500"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="shieldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="shieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#0284c7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Outer Shield Contour */}
          <path
            d="M250,40 L440,110 L440,290 C440,390 350,460 250,490 C150,460 60,390 60,290 L60,110 Z"
            fill="url(#shieldGrad1)"
            stroke="url(#shieldStroke)"
            strokeWidth="1.5"
          />

          {/* Inner Accent Checkmark / Crest */}
          <path
            d="M170,250 L225,305 L345,185"
            stroke="url(#shieldStroke)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Angled Isometric Clean Line Accents */}
          <line x1="200" y1="90" x2="430" y2="320" stroke="url(#shieldStroke)" strokeWidth="0.8" opacity="0.35" />
          <line x1="150" y1="130" x2="380" y2="360" stroke="url(#shieldStroke)" strokeWidth="0.8" opacity="0.25" />
          <line x1="100" y1="180" x2="310" y2="390" stroke="url(#shieldStroke)" strokeWidth="0.8" opacity="0.15" />
        </svg>

        {/* Bottom-Left Radiating Concentric Arcs */}
        <svg
          className="absolute -bottom-16 -left-16 w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] opacity-35 dark:opacity-15 transition-opacity duration-500"
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="100" cy="400" r="140" stroke="#06b6d4" strokeWidth="1" opacity="0.35" />
          <circle cx="100" cy="400" r="220" stroke="#0284c7" strokeWidth="1.2" opacity="0.25" />
          <circle cx="100" cy="400" r="300" stroke="#38bdf8" strokeWidth="0.8" opacity="0.15" />
        </svg>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
        {/* Soft radial glow centers */}
        <div className="absolute top-1/4 -right-16 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-teal-400/10 via-cyan-400/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-sky-400/10 via-cyan-300/5 to-transparent blur-3xl pointer-events-none" />

        {/* Clean Architectural Grid Lines (No dots) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-35 dark:opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="cleanGridPattern" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#06b6d4" strokeWidth="0.6" strokeOpacity="0.25" />
            </pattern>
            <linearGradient id="fadeGridMask" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0.5" />
            </linearGradient>
            <mask id="gridMask">
              <rect width="100%" height="100%" fill="url(#fadeGridMask)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#cleanGridPattern)" mask="url(#gridMask)" />
        </svg>
      </div>
    );
  }

  // Default: "waves" (Fluid organic waves, mesh glow contours — no dots)
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      {/* ── Layer 1: Ambient Mesh Glow Orbs ──────────────────────────── */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-400/20 via-sky-300/15 to-transparent blur-3xl dark:from-cyan-500/10 dark:via-sky-600/10 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-teal-400/20 via-cyan-300/15 to-transparent blur-3xl dark:from-teal-500/10 dark:via-cyan-600/10 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-sky-400/10 dark:bg-cyan-400/5 blur-3xl pointer-events-none" />

      {/* ── Layer 2: Top-Right Layered Modern Fluid Waves ────────────── */}
      <svg
        className="absolute -top-10 -right-12 w-[340px] sm:w-[440px] h-[340px] sm:h-[440px] opacity-70 dark:opacity-30 transition-opacity duration-500"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="modernWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="modernWaveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="modernWaveGrad3" x1="50%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="strokeGlow1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Back Wave */}
        <path
          d="M120,0 C220,50 280,130 320,230 C360,330 330,420 500,480 L500,0 Z"
          fill="url(#modernWaveGrad1)"
        />

        {/* Middle Layer Wave with stroke contour */}
        <path
          d="M210,0 C280,90 330,170 380,290 C410,360 420,410 500,430 L500,0 Z"
          fill="url(#modernWaveGrad2)"
          stroke="url(#strokeGlow1)"
          strokeWidth="1.2"
        />

        {/* Foreground Crest Wave */}
        <path
          d="M310,0 C360,80 410,160 450,250 C470,300 480,340 500,360 L500,0 Z"
          fill="url(#modernWaveGrad3)"
        />
      </svg>

      {/* ── Layer 3: Bottom-Left Organic Rising Wave ─────────────────── */}
      <svg
        className="absolute -bottom-14 -left-14 w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] opacity-65 dark:opacity-25 transition-opacity duration-500"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="modernWaveGrad4" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="strokeGlow2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path
          d="M0,500 L0,190 C90,230 160,320 260,340 C350,360 410,410 500,500 Z"
          fill="url(#modernWaveGrad4)"
          stroke="url(#strokeGlow2)"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
};

// Aliased export for backwards compatibility
export const AuthWatermarkBackground = AppWatermark;
export default AppWatermark;
