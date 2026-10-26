import React from "react";

export const AuthWatermarkBackground = ({ showDots = true }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
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

      {/* ── Layer 4: Delicate Modern Floating Particles ──────────────── */}
      {showDots && (
        <div className="absolute inset-0">
          {/* Top area */}
          <div className="absolute top-[14%] left-[10%] w-2 h-2 rounded-full bg-cyan-400/70 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          <div className="absolute top-[22%] right-[12%] w-2.5 h-2.5 rounded-full bg-sky-400/60 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          <div className="absolute top-[32%] left-[16%] w-1.5 h-1.5 rounded-full bg-teal-400/50" />

          {/* Middle area */}
          <div className="absolute top-[52%] right-[8%] w-2 h-2 rounded-full bg-cyan-400/50 shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
          <div className="absolute top-[64%] left-[8%] w-2.5 h-2.5 rounded-full bg-sky-400/60 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />

          {/* Bottom area */}
          <div className="absolute top-[76%] right-[14%] w-2 h-2 rounded-full bg-teal-400/50" />
          <div className="absolute top-[86%] left-[14%] w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
        </div>
      )}
    </div>
  );
};

export default AuthWatermarkBackground;
