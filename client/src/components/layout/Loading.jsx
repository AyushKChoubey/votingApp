import React from 'react';

// Spinner Component
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`loading-spinner ${sizes[size]} ${className}`}></div>
  );
};

// Loading Button
export const LoadingButton = ({ 
  loading = false, 
  children, 
  disabled, 
  className = '',
  loadingText = 'Loading...',
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`btn relative ${className}`}
    >
      {loading && (
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Spinner size="sm" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {loading && loadingText ? loadingText : children}
      </span>
    </button>
  );
};

// Skeleton Loader
export const Skeleton = ({ className = '', width = 'w-full', height = 'h-4' }) => {
  return (
    <div className={`skeleton rounded ${width} ${height} ${className}`}></div>
  );
};

// Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="card animate-pulse">
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
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <div className="flex space-x-4">
          <Skeleton height="h-4" width="w-12" />
          <Skeleton height="h-4" width="w-16" />
        </div>
        <Skeleton height="h-8" width="w-20" className="rounded-lg" />
      </div>
    </div>
  );
};

// Full Page Loading
export const PageLoading = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 loading-spinner mx-auto"></div>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">VoteBooth</h3>
        <p className="text-neutral-600">{message}</p>
      </div>
    </div>
  );
};

// Content Loading (for sections within a page)
export const ContentLoading = ({ message = 'Loading content...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" className="mb-4" />
      <p className="text-neutral-600 text-sm">{message}</p>
    </div>
  );
};

// Loading Overlay
export const LoadingOverlay = ({ show = false, message = 'Loading...' }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" className="mb-4" />
        <p className="text-neutral-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Inline Loading (for buttons, form fields, etc.)
export const InlineLoading = ({ size = 'sm', className = '' }) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <Spinner size={size} />
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
        <div key={rowIndex} className="grid gap-4 py-4 border-b border-neutral-100" 
             style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
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
  emptyState = null 
}) => {
  if (loading) {
    return loadingComponent;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.736 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">Something went wrong</h3>
        <p className="text-neutral-600 mb-4">{error}</p>
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

// Simple Loading component for common use
export const Loading = ({ size = 'md', color = 'teal' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const colors = {
    teal: 'text-teal-500',
    white: 'text-white',
    gray: 'text-gray-500'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizes[size]} ${colors[color]}`}></div>
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
  Loading
};