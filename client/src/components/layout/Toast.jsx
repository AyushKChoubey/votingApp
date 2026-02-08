import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';

// Individual Toast Component
export function Toast({ message, type = 'success', duration = 4500, onClose }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const startRef = useRef(Date.now());
    const rafRef = useRef(null);
    const touchStartX = useRef(0);
    const translateX = useRef(0);
    const [progress, setProgress] = useState(100);

    const accent = {
        success: 'bg-emerald-500/90',
        error: 'bg-rose-500/90',
        info: 'bg-sky-500/90',
        warning: 'bg-amber-400/90'
    }[type] || 'bg-sky-500/90';

    const icons = {
        success: (
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M4.5 10.5L8.5 14.5L15.5 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 6.5v.01M10 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.25" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5 text-black" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 4L17 16H3L10 4z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 9v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    };

    useEffect(() => {
        startRef.current = Date.now();
        const tick = () => {
            if (isPaused || !isVisible) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }
            const elapsed = Date.now() - startRef.current;
            const pct = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(pct);
            if (pct <= 0) {
                setIsVisible(false);
                if (onClose) onClose();
                cancelAnimationFrame(rafRef.current);
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [duration, isPaused, onClose, isVisible]);

    const onTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        setIsPaused(true);
    };
    const onTouchMove = (e) => {
        const delta = e.touches[0].clientX - touchStartX.current;
        translateX.current = delta;
    };
    const onTouchEnd = () => {
        setIsPaused(false);
        if (Math.abs(translateX.current) > 80) {
            setIsVisible(false);
            if (onClose) onClose();
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
            className={`pointer-events-auto transform transition-all duration-300 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: 'pan-y' }}
        >
            <div className="flex items-start w-full sm:w-auto sm:max-w-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl ring-1 ring-black/5 overflow-hidden">
                {/* Accent strip */}
                <div className={`w-1.5 ${accent} rounded-l-2xl`} />

                <div className="flex gap-3 p-3 sm:p-3 items-start flex-1">
                    <div className="flex-shrink-0 mt-0.5 flex items-center justify-center w-9 h-9 rounded-full bg-black/5 dark:bg-white/5">{icons[type]}</div>

                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">{message}</div>
                    </div>

                    <div className="ml-2 flex items-start">
                        <button
                            onClick={handleClose}
                            aria-label="Dismiss notification"
                            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                        >
                            <svg className="w-4 h-4 text-slate-700 dark:text-slate-200" viewBox="0 0 20 20" fill="none" aria-hidden>
                                <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Progress indicator (bottom) */}
                <div className="absolute left-0 right-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10">
                    <div className={`h-1 ${accent} transition-[width]`} style={{ width: `${progress}%` }} />
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
            
            {/* Toast Container: bottom-centered full-width on mobile, compact top-right on larger screens */}
            <div className="fixed z-50 pointer-events-none inset-x-4 bottom-4 sm:inset-x-auto sm:top-4 sm:right-4 flex flex-col items-center sm:items-end space-y-2">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto w-full sm:w-auto">
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