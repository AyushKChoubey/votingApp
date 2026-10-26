import React from "react";

/**
 * Modern Accessible Toggle / Switch Component
 *
 * @param {boolean} checked - Current checked status
 * @param {(checked: boolean) => void} onChange - Callback when toggled
 * @param {boolean} [disabled=false] - Whether toggle is interactive
 * @param {'sm'|'md'|'lg'} [size='md'] - Visual size of toggle
 * @param {React.ReactNode} [label] - Optional label
 * @param {string} [description] - Optional subtext/description
 * @param {'left'|'right'} [labelPosition='left'] - Position of label relative to switch
 * @param {string} [ariaLabel] - Accessibility label
 * @param {string} [id] - HTML element ID
 * @param {string} [className] - Additional wrapper classes
 */
const Toggle = ({
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  label,
  description,
  labelPosition = "left",
  ariaLabel,
  id,
  className = "",
}) => {
  const handleClick = (e) => {
    e.preventDefault();
    if (disabled || !onChange) return;
    onChange(!checked);
  };

  const handleKeyDown = (e) => {
    if (disabled || !onChange) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  // Size definitions for track and thumb
  const sizeStyles = {
    sm: {
      track: "h-5 w-9 border",
      thumb: "h-3.5 w-3.5",
      translate: "translate-x-4",
      defaultTranslate: "translate-x-0.5",
    },
    md: {
      track: "h-6 w-11 border-2",
      thumb: "h-4 w-4",
      translate: "translate-x-5",
      defaultTranslate: "translate-x-0.5",
    },
    lg: {
      track: "h-7 w-14 border-2",
      thumb: "h-5 w-5",
      translate: "translate-x-7",
      defaultTranslate: "translate-x-0.5",
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  const switchButton = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed ${
        currentSize.track
      } ${
        checked
          ? "bg-accent border-accent shadow-xs"
          : "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
      }`}
    >
      <span
        className={`pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
          currentSize.thumb
        } ${checked ? currentSize.translate : currentSize.defaultTranslate}`}
      />
    </button>
  );

  if (!label && !description) {
    return switchButton;
  }

  return (
    <div
      onClick={!disabled && onChange ? () => onChange(!checked) : undefined}
      className={`flex items-center justify-between gap-3 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${className}`}
    >
      {labelPosition === "left" && (
        <div className="flex-1 min-w-0 pr-2">
          {label && <div className="text-xs sm:text-sm font-bold theme-text">{label}</div>}
          {description && <div className="text-[11px] theme-muted mt-0.5">{description}</div>}
        </div>
      )}
      {switchButton}
      {labelPosition === "right" && (
        <div className="flex-1 min-w-0 pl-2">
          {label && <div className="text-xs sm:text-sm font-bold theme-text">{label}</div>}
          {description && <div className="text-[11px] theme-muted mt-0.5">{description}</div>}
        </div>
      )}
    </div>
  );
};

export default Toggle;
export { Toggle };

