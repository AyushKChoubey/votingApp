import React, { useState, useEffect } from 'react';
import { useRegisterModal } from '../../hooks/useRegisterModal';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm',
  description = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  requireText = null, // string the user must type to confirm
  loading = false,
  variant = 'danger', // 'danger' | 'primary'
  onConfirm = () => {},
  onCancel = () => {}
}) {
  useRegisterModal(isOpen, onCancel);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!isOpen) setInput('');
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = !requireText || input.trim() === requireText;

  const confirmBtnClasses = variant === 'primary'
    ? (canConfirm && !loading ? 'btn-theme text-on-primary font-semibold shadow-md active:scale-95' : 'bg-accent/40 text-on-primary cursor-not-allowed')
    : (canConfirm && !loading ? 'bg-red-600 hover:bg-red-700 font-semibold' : 'bg-red-300 cursor-not-allowed');

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div className="theme-surface rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 border-t sm:border border-border animate-slideUp">
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {variant === 'primary' ? (
              <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent/15 text-accent border border-accent/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : (
              <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold theme-text">{title}</h3>
            {description && <p className="text-sm theme-muted mt-2">{description}</p>}

            {requireText && (
              <div className="mt-4">
                <label className="block text-xs theme-text mb-1">Type <span className="font-mono theme-surface px-2 py-0.5 rounded border border-border">{requireText}</span> to confirm</label>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent theme-surface theme-text"
                  placeholder={`Type ${requireText} to confirm`}
                />
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={onCancel} className="px-4 py-2 rounded-lg theme-surface theme-text hover:bg-accent/10 border border-border transition-colors">
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={!canConfirm || loading}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${confirmBtnClasses}`}
              >
                {loading ? 'Working...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
