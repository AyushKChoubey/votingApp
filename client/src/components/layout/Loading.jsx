import React from "react";

// Modern Spinner Component with Multiple Animations
export const Spinner = ({
  size = "md",
  variant = "spin",
  color = "teal",
  className = "",
}) => {
  const sizes = {
    xs: { width: 12, height: 12, stroke: 2 },
    sm: { width: 16, height: 16, stroke: 2 },
    md: { width: 24, height: 24, stroke: 3 },
    lg: { width: 32, height: 32, stroke: 3 },
    xl: { width: 48, height: 48, stroke: 4 },
  };

  const colors = {
    teal: "var(--color-accent)",
    blue: "var(--color-info)",
    purple: "var(--color-secondary)",
    green: "var(--color-success)",
    white: "#ffffff",
    primary: "var(--color-primary)",
    theme: "var(--color-accent)",
  };

  const { width, height, stroke } = sizes[size];
  const strokeColor = colors[color];

  if (variant === "pulse") {
    return (
      <div className={className} style={{ width, height }}>
        <div 
          className="w-full h-full rounded-full animate-pulse opacity-75" 
          style={{ backgroundColor: strokeColor }}
        ></div>
      </div>
    );
  }

  if (variant === "bounce") {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div
          className="rounded-full animate-bounce"
          style={{ 
            width: width * 0.3, 
            height: width * 0.3, 
            backgroundColor: strokeColor,
            animationDelay: "0ms"
          }}
        ></div>
        <div
          className="rounded-full animate-bounce"
          style={{ 
            width: width * 0.3, 
            height: width * 0.3, 
            backgroundColor: strokeColor,
            animationDelay: "150ms"
          }}
        ></div>
        <div
          className="rounded-full animate-bounce"
          style={{ 
            width: width * 0.3, 
            height: width * 0.3, 
            backgroundColor: strokeColor,
            animationDelay: "300ms"
          }}
        ></div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: strokeColor, animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: strokeColor, animationDelay: "200ms" }}
        ></div>
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: strokeColor, animationDelay: "400ms" }}
        ></div>
      </div>
    );
  }

  // Default spin variant with SVG
  return (
    <svg
      className={`animate-spin ${className}`}
      width={width}
      height={height}
      viewBox="0 0 50 50"
      style={{ animationDuration: '0.8s' }}
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={strokeColor}
        strokeWidth={stroke}
        opacity="0.2"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={strokeColor}
        strokeWidth={stroke}
        strokeDasharray="80, 200"
        strokeLinecap="round"
      />
    </svg>
  );
};

// Modern Loading Button with Better UX
export const LoadingButton = ({
  loading = false,
  children,
  disabled,
  className = "",
  loadingText,
  variant = "primary",
  size = "md",
  ...props
}) => {
  const variants = {
    primary: "btn-theme",
    secondary:
      "bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl",
    outline: "border-2 border-accent text-accent hover:bg-accent-50 bg-white",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl",
    success:
      "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl",
    teal: "btn-theme",
    blue: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl",
    green:
      "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl",
    red: "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl",
    gray: "bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`
        relative inline-flex items-center justify-center font-semibold rounded-lg 
        transition-all duration-200 transform hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin"
            width="20"
            height="20"
            viewBox="0 0 50 50"
            style={{ animationDuration: '0.8s' }}
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              opacity="0.3"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="80, 200"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
      <span
        className={`transition-opacity duration-200 ${loading ? "opacity-0" : "opacity-100"}`}
      >
        {loadingText && loading ? loadingText : children}
      </span>
    </button>
  );
};

// Modern Skeleton Loader with Shimmer Effect
export const Skeleton = ({
  className = "",
  width = "w-full",
  height = "h-4",
  variant = "default",
  animate = true,
}) => {
  const variants = {
    default: "theme-surface",
    card: "theme-surface",
    text: "theme-surface rounded-full",
    avatar: "theme-surface rounded-full",
    image: "theme-surface rounded-lg",
  };

  const animationClass = animate ? "animate-pulse" : "";
  const shimmerClass = animate
    ? "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent"
    : "";

  return (
    <div
      className={`
      ${variants[variant]} ${width} ${height} ${animationClass} ${shimmerClass}
      ${variant === "default" ? "rounded" : ""}
      ${className}
    `}
    ></div>
  );
};

// Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="glass-card animate-pulse p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton height="h-6" width="w-3/4" />
          <Skeleton height="h-4" width="w-1/2" />
        </div>
        <Skeleton height="h-8" width="w-16" className="rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton height="h-4" />
        <Skeleton height="h-4" width="w-5/6" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex space-x-4">
          <Skeleton height="h-4" width="w-12" />
          <Skeleton height="h-4" width="w-16" />
        </div>
        <Skeleton height="h-8" width="w-20" className="rounded-lg" />
      </div>
    </div>
  );
};

// Modern Full Page Loading with Better Animation
export const PageLoading = ({
  message = "Loading...",
  variant = "spin",
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen theme-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 pointer-events-none">
        <div 
          className="w-64 h-64 rounded-full blur-3xl opacity-20 animate-pulse" 
          style={{ 
            background: 'radial-gradient(circle, var(--color-primary), var(--color-accent))',
            animationDuration: '3s'
          }} 
        />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 pointer-events-none">
        <div 
          className="w-64 h-64 rounded-full blur-3xl opacity-15 animate-pulse" 
          style={{ 
            background: 'radial-gradient(circle, var(--color-accent), var(--color-secondary))',
            animationDuration: '4s',
            animationDelay: '1s'
          }} 
        />
      </div>

      <div className="text-center max-w-md relative z-10">
        {/* Logo */}
        {showLogo && (
          <div className="mb-8 flex justify-center animate-fadeIn">
            <div className="btn-theme p-5 rounded-2xl shadow-2xl">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        )}
        
        {/* Main Spinner - VISIBLE AND OBVIOUS */}
        <div className="flex justify-center mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="relative w-20 h-20">
            {/* Spinning gradient ring */}
            <svg className="w-20 h-20 animate-spin" style={{ animationDuration: '1s' }} viewBox="0 0 50 50">
              <circle
                className="opacity-20"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                style={{ color: 'var(--color-accent)' }}
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="80, 200"
                strokeLinecap="round"
                style={{ 
                  color: 'var(--color-accent)',
                  transformOrigin: 'center',
                }}
              />
            </svg>
          </div>
        </div>
        
        {/* Content card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl animate-fadeIn border-accent/20" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-2xl font-bold theme-text mb-3">
            VoteBooth
          </h3>
          <p className="theme-muted text-sm leading-relaxed">{message}</p>
          
          {/* Simple progress dots */}
          <div className="flex justify-center items-center space-x-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }}></div>
            <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Loading (for sections within a page)
export const ContentLoading = ({ message = "Loading content..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
      <div className="mb-6">
        <svg
          className="animate-spin"
          width="48"
          height="48"
          viewBox="0 0 50 50"
          style={{ animationDuration: '0.8s' }}
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            opacity="0.2"
            style={{ color: 'var(--color-accent)' }}
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray="80, 200"
            strokeLinecap="round"
            style={{ color: 'var(--color-accent)' }}
          />
        </svg>
      </div>
      <p className="theme-muted text-sm font-medium">{message}</p>
      {/* Animated dots */}
      <div className="flex items-center space-x-1 mt-3">
        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

// Loading Overlay
export const LoadingOverlay = ({ show = false, message = "Loading..." }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 theme-bg/90 backdrop-blur-md z-50 flex items-center justify-center animate-fadeIn">
      <div className="text-center glass-card p-8 rounded-2xl shadow-2xl border-accent/20 max-w-sm">
        {/* SVG Spinner */}
        <div className="flex justify-center mb-6">
          <svg
            className="animate-spin"
            width="64"
            height="64"
            viewBox="0 0 50 50"
            style={{ animationDuration: '0.8s' }}
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              opacity="0.2"
              style={{ color: 'var(--color-accent)' }}
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="80, 200"
              strokeLinecap="round"
              style={{ color: 'var(--color-accent)' }}
            />
          </svg>
        </div>
        <p className="theme-text font-semibold text-lg mb-2">{message}</p>
        {/* Progress dots */}
        <div className="flex justify-center items-center space-x-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

// Inline Loading (for buttons, form fields, etc.)
export const InlineLoading = ({ size = "sm", className = "" }) => {
  const width = size === "sm" ? 16 : 24;
  const height = size === "sm" ? 16 : 24;
  
  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg
        className="animate-spin"
        width={width}
        height={height}
        viewBox="0 0 50 50"
        style={{ animationDuration: '0.8s' }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.2"
          style={{ color: 'var(--color-accent)' }}
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="80, 200"
          strokeLinecap="round"
          style={{ color: 'var(--color-accent)' }}
        />
      </svg>
    </div>
  );
};

// Loading States for Lists
export const ListLoading = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
};

// Loading State for Tables
export const TableLoading = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 py-4 border-b border-border"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} />
          ))}
        </div>
      ))}
    </div>
  );
};

// Loading with Error Boundary
export const LoadingWithError = ({
  loading = false,
  error = null,
  onRetry,
  children,
  loadingComponent = <ContentLoading />,
  emptyState = null,
}) => {
  if (loading) {
    return loadingComponent;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-error-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-error"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.736 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium theme-text mb-2">
          Something went wrong
        </h3>
        <p className="theme-muted mb-4">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (emptyState && React.Children.count(children) === 0) {
    return emptyState;
  }

  return children;
};

// Enhanced Loading component with modern animations
export const Loading = ({
  size = "md",
  color = "teal",
  variant = "spin",
  className = "",
  text,
}) => {
  const sizes = {
    xs: { width: 12, height: 12 },
    sm: { width: 16, height: 16 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
    xl: { width: 48, height: 48 },
  };

  const colors = {
    teal: "var(--color-accent)",
    blue: "var(--color-info)",
    purple: "var(--color-secondary)",
    white: "#ffffff",
    primary: "var(--color-primary)",
    theme: "var(--color-accent)",
  };

  const { width, height } = sizes[size];
  const strokeColor = colors[color];

  const LoadingElement = () => {
    if (variant === "pulse") {
      return (
        <div style={{ width, height }}>
          <div
            className="w-full h-full rounded-full animate-pulse opacity-75"
            style={{ backgroundColor: strokeColor }}
          ></div>
        </div>
      );
    }

    if (variant === "dots") {
      return (
        <div className="flex items-center space-x-1">
          <div
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: strokeColor, animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: strokeColor, animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: strokeColor, animationDelay: "300ms" }}
          ></div>
        </div>
      );
    }

    // Default spin
    return (
      <svg
        className="animate-spin"
        width={width}
        height={height}
        viewBox="0 0 50 50"
        style={{ animationDuration: '0.8s' }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          opacity="0.2"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeDasharray="80, 200"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div
      className={`flex items-center justify-center ${text ? "space-x-3" : ""} ${className}`}
    >
      <LoadingElement />
      {text && (
        <span className="text-sm font-medium theme-text">
          {text}
        </span>
      )}
    </div>
  );
};

export default {
  Spinner,
  LoadingButton,
  Skeleton,
  CardSkeleton,
  PageLoading,
  ContentLoading,
  LoadingOverlay,
  InlineLoading,
  ListLoading,
  TableLoading,
  LoadingWithError,
  Loading,
};
