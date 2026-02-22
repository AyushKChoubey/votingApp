import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Button Component
 * 
 * @param {string} variant - Button style variant: 'primary', 'secondary', 'outline', 'ghost'
 * @param {string} size - Button size: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} fullWidth - Make button full width
 * @param {string} to - If provided, renders as Link (for internal routes)
 * @param {string} href - If provided, renders as anchor (for external links)
 * @param {boolean} disabled - Disable the button
 * @param {boolean} loading - Show loading state
 * @param {React.ReactNode} icon - Icon component to display
 * @param {string} iconPosition - Icon position: 'left', 'right'
 * @param {React.ReactNode} children - Button content
 * @param {string} className - Additional CSS classes
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  to,
  href,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}) => {
  // Base classes with animations
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus-ring disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]';

  // Variant styles - Fixed for light mode visibility
  const variants = {
    primary: 'btn-theme ripple shadow-xl hover:shadow-2xl [color:var(--color-on-primary)]',
    secondary: 'theme-surface border-2 border-border hover:btn-theme interactive-scale theme-text shadow-sm hover:shadow-xl transition-colors',
    outline: 'bg-transparent border-2 border-accent text-accent hover:bg-accent [&:hover]:text-white shadow-sm hover:shadow-lg',
    ghost: 'bg-transparent theme-text hover:bg-theme-surface hover:shadow-md',
    success: 'bg-success [color:white] hover:bg-success/90 shadow-lg hover:shadow-xl',
    danger: 'bg-error [color:white] hover:bg-error/90 shadow-lg hover:shadow-xl',
  };

  // Size styles
  const sizes = {
    sm: 'text-xs py-2 px-3 rounded-lg gap-1.5',
    md: 'text-sm py-2.5 px-4 rounded-xl gap-2',
    lg: 'text-base py-3 px-6 rounded-xl gap-2',
    xl: 'text-lg py-4 px-8 rounded-xl gap-2.5',
  };

  // Combine classes with group for child hover effects
  const buttonClasses = `
    group
    ${baseClasses}
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Loading spinner with pulse animation
  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4 " fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Button content with icon - animated entrance
  const ButtonContent = () => (
    <>
      {loading && (
        <span className="animate-fadeIn">
          <LoadingSpinner />
        </span>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="transition-transform duration-300 group-hover:scale-105">
          {icon}
        </span>
      )}
      <span className="transition-all duration-300">
        {children}
      </span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="transition-transform duration-300 group-hover:scale-105">
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
      <a href={href} className={buttonClasses} target="_blank" rel="noopener noreferrer" {...props}>
        <ButtonContent />
      </a>
    );
  }

  // Render as button
  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      <ButtonContent />
    </button>
  );
};

export default Button;
