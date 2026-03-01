import React from "react";
import { Link } from "react-router-dom";

/**
 * Modern Button Component with built-in animations
 *
 * @param {'primary'|'secondary'|'outline'|'ghost'|'success'|'danger'} variant
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {boolean} fullWidth
 * @param {string} to - Internal route (renders Link)
 * @param {string} href - External URL (renders anchor)
 * @param {boolean} disabled
 * @param {boolean} loading
 * @param {React.ReactNode} icon
 * @param {'left'|'right'} iconPosition
 * @param {React.ReactNode} children
 * @param {string} className
 */
const Button = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  to,
  href,
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  children,
  className = "",
  ...props
}) => {
  // Base styles with smooth micro-animations
  const baseClasses = [
    "group relative inline-flex items-center justify-center font-semibold",
    "transition-all duration-300 ease-out",
    "focus-ring",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    "active:scale-[0.97]",
    "overflow-hidden",
  ].join(" ");

  // Variant styles
  const variants = {
    primary: [
      "btn-theme",
      "[color:var(--color-on-primary)]",
      "shadow-md hover:shadow-xl",
      "hover:-translate-y-0.5",
    ].join(" "),
    secondary: [
      "theme-surface border-2 border-border theme-text",
      "hover:border-accent/40 hover:shadow-lg",
      "hover:-translate-y-0.5",
    ].join(" "),
    outline: [
      "bg-transparent border-2 border-accent text-accent",
      "hover:bg-accent [&:hover]:text-white",
      "shadow-sm hover:shadow-lg",
      "hover:-translate-y-0.5",
    ].join(" "),
    ghost: [
      "bg-transparent theme-text",
      "hover:bg-accent-50 hover:text-accent",
    ].join(" "),
    success: [
      "bg-success [color:white]",
      "hover:bg-success/90 shadow-md hover:shadow-xl",
      "hover:-translate-y-0.5",
    ].join(" "),
    danger: [
      "bg-error [color:white]",
      "hover:bg-error/90 shadow-md hover:shadow-xl",
      "hover:-translate-y-0.5",
    ].join(" "),
  };

  // Size styles
  const sizes = {
    sm: "text-xs py-2 px-3 rounded-lg gap-1.5",
    md: "text-sm py-2.5 px-4 rounded-xl gap-2",
    lg: "text-base py-3 px-6 rounded-xl gap-2",
    xl: "text-lg py-4 px-8 rounded-2xl gap-2.5",
  };

  const buttonClasses = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // Animated loading spinner
  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Button inner content with icon hover animations
  const ButtonContent = () => (
    <>
      {/* Subtle shine overlay on hover */}
      <span
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.12) 55%, transparent 60%)",
          backgroundSize: "200% 100%",
          animation: "none",
        }}
        aria-hidden="true"
      />

      {loading && (
        <span className="animate-fadeIn">
          <LoadingSpinner />
        </span>
      )}
      {!loading && icon && iconPosition === "left" && (
        <span className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
          {icon}
        </span>
      )}
      <span className="relative z-10">{children}</span>
      {!loading && icon && iconPosition === "right" && (
        <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110">
          {icon}
        </span>
      )}
    </>
  );

  // Render as Link (internal navigation)
  if (to && !disabled) {
    return (
      <Link to={to} className={buttonClasses} {...props}>
        <ButtonContent />
      </Link>
    );
  }

  // Render as anchor (external link)
  if (href && !disabled) {
    return (
      <a
        href={href}
        className={buttonClasses}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        <ButtonContent />
      </a>
    );
  }

  // Render as button
  return (
    <button className={buttonClasses} disabled={disabled || loading} {...props}>
      <ButtonContent />
    </button>
  );
};

export default Button;
