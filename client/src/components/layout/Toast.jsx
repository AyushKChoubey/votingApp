import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';

// Individual Toast Component
export function Toast({ message, type = 'success', duration = 4000, onClose }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const startRef = useRef(Date.now());
    const remainingRef = useRef(duration);
    const rafRef = useRef(null);
    const touchStartX = useRef(0);
    const translateX = useRef(0);
    const [translate, setTranslate] = useState(0);

    const typeStyles = {
        success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-600',
        error: 'bg-gradient-to-r from-rose-500 to-red-500 text-white border-rose-600',
        info: 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white border-sky-600',
        warning: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black border-amber-600'
    };

    const icons = {
        success: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        )
    };

    // Pause / resume handling
    useEffect(() => {
        startRef.current = Date.now();
        remainingRef.current = duration;

        function tick() {
            if (isPaused || !isVisible) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const elapsed = Date.now() - startRef.current;
            const remaining = duration - elapsed;
            remainingRef.current = remaining;
            setTranslate(((duration - Math.max(0, remaining)) / duration) * 100);

            if (remaining <= 0) {
                setIsVisible(false);
                if (onClose) onClose();
                cancelAnimationFrame(rafRef.current);
                return;
            }

            rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(rafRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration, isPaused]);

    // Touch / swipe to dismiss
    const onTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        setIsPaused(true);
    };

    const onTouchMove = (e) => {
        const delta = e.touches[0].clientX - touchStartX.current;
        translateX.current = delta;
        setTranslate(Math.min(100, Math.max(-100, (delta / 2))));
    };

    const onTouchEnd = () => {
        setIsPaused(false);
        if (Math.abs(translateX.current) > 60) {
            setIsVisible(false);
            if (onClose) onClose();
        } else {
            // reset transform
            setTranslate(0);
        }
        translateX.current = 0;
    };

    const handleClose = useCallback(() => {
        setIsVisible(false);
        if (onClose) onClose();
    }, [onClose]);

    return (
        <div
            role="status"
            aria-live={type === 'error' ? 'assertive' : 'polite'}
            className={`transition-transform duration-300 ease-out transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'} pointer-events-auto`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: 'pan-y' }}
        >
            <div className={`relative flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg w-full sm:w-auto max-w-sm border ${typeStyles[type]}`}>
                <div className="flex-shrink-0 mt-0.5">
                    {icons[type]}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{message}</div>
                </div>
                <div className="flex items-start ml-2">
                    <button
                        onClick={handleClose}
                        aria-label="Dismiss notification"
                        className="ml-2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Progress bar */}
                <div className="absolute left-0 bottom-0 h-1 bg-white/30 rounded-b-lg w-full overflow-hidden">
                    <div className="h-1 bg-white/80 transition-all" style={{ width: `${translate}%` }} />
                </div>
            </div>
        </div>
    );
}

// Toast Context
const ToastContext = createContext();

// Toast Provider Component
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    // max number of toasts to keep on screen
    const MAX_TOASTS = 5;

    const addToast = (message, type = 'success', duration = 4000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };

        setToasts(prev => {
            const next = [...prev, toast];
            if (next.length > MAX_TOASTS) {
                // drop the oldest
                next.shift();
            }
            return next;
        });

        // We rely on the Toast component to call onClose when its timer finishes.
        // As a safety fallback, remove the toast after duration + 10s to avoid leaks.
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration + 10000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            
            {/* Toast Container: bottom inset on mobile, top-right on larger screens. Use inset-x padding to avoid 100vw calc overflow. */}
            <div className="fixed z-50 space-y-2 pointer-events-none inset-x-4 bottom-4 sm:bottom-auto sm:inset-x-auto sm:top-4 sm:right-4">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// Custom hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};