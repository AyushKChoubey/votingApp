/**
 * Inline SVG icon components — zero external dependencies.
 * All icons accept standard SVG props (className, style, aria-*, etc.).
 * Source paths are faithful reproductions of the originals from
 * lucide-react and react-icons/fc (Google).
 */

const iconDefaults = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "1em",
  height: "1em",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Stroke-based icon wrapper */
const StrokeIcon = ({ children, className, style, ...rest }) => (
  <svg {...iconDefaults} className={className} style={style} {...rest}>
    {children}
  </svg>
);

// ── Mail ───────────────────────────────────────────────────────────────────────
export const Mail = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </StrokeIcon>
);

// ── Lock ───────────────────────────────────────────────────────────────────────
export const Lock = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </StrokeIcon>
);

// ── Eye ────────────────────────────────────────────────────────────────────────
export const Eye = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </StrokeIcon>
);

// ── EyeOff ─────────────────────────────────────────────────────────────────────
export const EyeOff = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </StrokeIcon>
);

// ── RefreshCw ──────────────────────────────────────────────────────────────────
export const RefreshCw = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </StrokeIcon>
);

// ── Loader2 (animated spinner) ─────────────────────────────────────────────────
export const Loader2 = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </StrokeIcon>
);

// ── ArrowRight ─────────────────────────────────────────────────────────────────
export const ArrowRight = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </StrokeIcon>
);

// ── ArrowLeft ──────────────────────────────────────────────────────────────────
export const ArrowLeft = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </StrokeIcon>
);

// ── CheckCircle ────────────────────────────────────────────────────────────────
export const CheckCircle = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </StrokeIcon>
);

// ── CheckCircle2 (solid-style check inside full circle) ────────────────────────
export const CheckCircle2 = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </StrokeIcon>
);

// ── XCircle ────────────────────────────────────────────────────────────────────
export const XCircle = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </StrokeIcon>
);

// ── AlertCircle ────────────────────────────────────────────────────────────────
export const AlertCircle = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </StrokeIcon>
);

// ── AlertTriangle ──────────────────────────────────────────────────────────────
export const AlertTriangle = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </StrokeIcon>
);

// ── HelpCircle ─────────────────────────────────────────────────────────────────
export const HelpCircle = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </StrokeIcon>
);

// ── Clock ──────────────────────────────────────────────────────────────────────
export const Clock = ({ className, style, ...rest }) => (
  <StrokeIcon className={className} style={style} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </StrokeIcon>
);

// ── Google (multi-color, replaces FcGoogle from react-icons/fc) ────────────────
export const GoogleIcon = ({ className, style, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="1em"
    height="1em"
    className={className}
    style={style}
    aria-hidden
    {...rest}
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);
