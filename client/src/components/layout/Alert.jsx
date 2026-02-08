import React, { useEffect, useState } from 'react';

const AlertIcon = ({ type }) => {
  const icons = {
    success: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    danger: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  };

  return icons[type] || icons.info;
};

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  autoClose = false, 
  autoCloseDelay = 5000,
  className = '',
  animate = true 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose();
    }, 300); // Wait for animation to complete
  };

  if (!isVisible) return null;

  // Modern color schemes using theme tokens
  const alertStyles = {
    success: {
      container: 'bg-success-50 border-success text-success',
      icon: 'text-success',
      iconBg: 'bg-success/10'
    },
    warning: {
      container: 'bg-warning-50 border-warning text-warning',
      icon: 'text-warning',
      iconBg: 'bg-warning/10'
    },
    danger: {
      container: 'bg-error-50 border-error text-error',
      icon: 'text-error',
      iconBg: 'bg-error/10'
    },
    error: {
      container: 'bg-error-50 border-error text-error',
      icon: 'text-error',
      iconBg: 'bg-error/10'
    },
    info: {
      container: 'bg-accent-50 border-accent theme-text',
      icon: 'text-accent',
      iconBg: 'bg-accent-100'
    }
  };

  const currentStyle = alertStyles[type] || alertStyles.info;

  return (
    <div 
      className={`
        glass-card backdrop-blur
        ${currentStyle.container}
        border-l-4 rounded-xl
        px-4 py-3 sm:px-5 sm:py-4
        shadow-lg
        flex items-start gap-3 sm:gap-4
        ${animate ? (isClosing ? 'animate-fadeOut' : 'animate-slideDown') : ''}
        transition-all duration-300
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon with modern background */}
      <div className={`flex-shrink-0 ${currentStyle.iconBg} rounded-lg p-2 sm:p-2.5`}>
        <div className={currentStyle.icon}>
          <AlertIcon type={type} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <h3 className="text-sm sm:text-base font-semibold mb-1 theme-text">
            {title}
          </h3>
        )}
        {message && (
          <div className="text-xs sm:text-sm theme-muted leading-relaxed">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        )}
      </div>

      {/* Close button with modern styling */}
      {onClose && (
        <div className="flex-shrink-0">
          <button
            onClick={handleClose}
            className="
              inline-flex items-center justify-center
              rounded-lg p-1.5 sm:p-2
              theme-text hover:theme-surface
              focus-ring
              transition-all duration-200
              interactive-scale
            "
            aria-label="Dismiss alert"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// Toast notification system
let toastId = 0;

export const toast = {
  success: (message, options = {}) => showToast('success', message, options),
  warning: (message, options = {}) => showToast('warning', message, options),
  danger: (message, options = {}) => showToast('danger', message, options),
  info: (message, options = {}) => showToast('info', message, options),
};

const showToast = (type, message, options) => {
  const id = ++toastId;
  const toastElement = document.createElement('div');
  toastElement.id = `toast-${id}`;
  
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-3 pointer-events-none max-w-md';
    container.style.cssText = 'z-index: var(--z-tooltip, 1070);';
    document.body.appendChild(container);
  }

  container.appendChild(toastElement);

  // Use React to render the toast
  import('react-dom/client').then(({ createRoot }) => {
    const root = createRoot(toastElement);
    root.render(
      <Alert
        type={type}
        message={message}
        autoClose={true}
        autoCloseDelay={options.duration || 5000}
        onClose={() => {
          root.unmount();
          container.removeChild(toastElement);
          if (container.children.length === 0) {
            document.body.removeChild(container);
          }
        }}
        className="pointer-events-auto w-full sm:max-w-sm"
        {...options}
      />
    );
  });

  return id;
};

export default Alert;
export { Alert };