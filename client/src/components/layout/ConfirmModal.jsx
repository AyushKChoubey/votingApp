import React, { useState, useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm',
  description = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  requireText = null, // string the user must type to confirm
  loading = false,
  onConfirm = () => {},
  onCancel = () => {}
}) {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!isOpen) setInput('');
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = !requireText || input.trim() === requireText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 mx-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="text-sm text-gray-600 mt-2">{description}</p>}

            {requireText && (
              <div className="mt-4">
                <label className="block text-xs text-gray-700 mb-1">Type <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{requireText}</span> to confirm</label>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder={`Type ${requireText} to confirm`}
                />
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={!canConfirm || loading}
                className={`px-4 py-2 rounded-lg text-white ${canConfirm && !loading ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'}`}
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
