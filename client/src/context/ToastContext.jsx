import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-slate-200 bg-white text-slate-900',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = 'info') => {
      const id = (nextId.current += 1);
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      notify: push,
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex animate-fade-in items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              TONE_STYLES[toast.tone]
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-lg leading-none opacity-50 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>');
  }
  return context;
}
