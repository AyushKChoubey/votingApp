import React from 'react';

// Modern Spinner Component with Multiple Animations
export const Spinner = ({ size = 'md', variant = 'spin', color = 'teal', className = '' }) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colors = {
    teal: 'border-teal-500 text-teal-500',
    blue: 'border-blue-500 text-blue-500',
    purple: 'border-purple-500 text-purple-500',
    green: 'border-green-500 text-green-500',
    white: 'border-white text-white',
    gray: 'border-gray-400 text-gray-400'
  };

  if (variant === 'pulse') {
    return (
      <div className={`${sizes[size]} ${colors[color]} ${className}`}>
        <div className="w-full h-full bg-current rounded-full animate-pulse opacity-75"></div>
      </div>
    );
  }

  if (variant === 'bounce') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className={`${sizes[size]} bg-current rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${sizes[size]} bg-current rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${sizes[size]} bg-current rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-2 h-2 bg-current rounded-full animate-pulse`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-2 h-2 bg-current rounded-full animate-pulse`} style={{ animationDelay: '200ms' }}></div>
        <div className={`w-2 h-2 bg-current rounded-full animate-pulse`} style={{ animationDelay: '400ms' }}></div>
      </div>
    );
  }

  // Default spin variant
  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className={`w-full h-full border-2 ${colors[color]} border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );
};

// Modern Loading Button with Better UX
export const LoadingButton = ({ 
  loading = false, 
  children, 
  disabled, 
  className = '',
  loadingText,
  variant = 'primary',
  size = 'md',
  ...props 
}) => {
  const variants = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50 bg-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
    teal: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    green: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
    red: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl',
    gray: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
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
          <Spinner size="sm" color="white" />
        </div>
      )}
      <span className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {loadingText && loading ? loadingText : children}
      </span>
    </button>
  );
};

// Modern Skeleton Loader with Shimmer Effect
export const Skeleton = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4',
  variant = 'default',
  animate = true 
}) => {
  const variants = {
    default: 'bg-gray-200',
    card: 'bg-gray-100 border border-gray-200',
    text: 'bg-gray-300 rounded-full',
    avatar: 'bg-gray-200 rounded-full',
    image: 'bg-gray-200 rounded-lg'
  };

  const animationClass = animate ? 'animate-pulse' : '';
  const shimmerClass = animate ? 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent' : '';

  return (
    <div className={`
      ${variants[variant]} ${width} ${height} ${animationClass} ${shimmerClass}
      ${variant === 'default' ? 'rounded' : ''}
      ${className}
    `}></div>
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

// Modern Full Page Loading with Better Animation
export const PageLoading = ({ 
  message = 'Loading...', 
  variant = 'spin',
  showLogo = true 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          {showLogo && (
            <div className="mb-4 flex justify-center">
              <div className="bg-teal-600 p-4 rounded-2xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          )}
          <Spinner size="xl" variant={variant} color="teal" className="mx-auto mb-4" />
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <h3 className="text-xl font-bold text-gray-900 mb-2">VoteBooth</h3>
          <p className="text-gray-600 animate-pulse">{message}</p>
        </div>
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

// Enhanced Loading component with modern animations
export const Loading = ({ 
  size = 'md', 
  color = 'teal', 
  variant = 'spin',
  className = '',
  text
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colors = {
    teal: 'text-teal-500 border-teal-500',
    blue: 'text-blue-500 border-blue-500',
    purple: 'text-purple-500 border-purple-500',
    white: 'text-white border-white',
    gray: 'text-gray-500 border-gray-500'
  };

  const LoadingElement = () => {
    if (variant === 'pulse') {
      return <div className={`${sizes[size]} ${colors[color]} bg-current rounded-full animate-pulse opacity-75`}></div>;
    }
    
    if (variant === 'dots') {
      return (
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 ${colors[color]} bg-current rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
          <div className={`w-2 h-2 ${colors[color]} bg-current rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
          <div className={`w-2 h-2 ${colors[color]} bg-current rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
        </div>
      );
    }
    
    // Default spin
    return (
      <div className={`${sizes[size]} ${colors[color]} animate-spin rounded-full border-2 border-current border-t-transparent`}></div>
    );
  };

  return (
    <div className={`flex items-center justify-center ${text ? 'space-x-3' : ''} ${className}`}>
      <LoadingElement />
      {text && (
        <span className={`text-sm font-medium ${colors[color]} animate-pulse`}>
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
  Loading
};