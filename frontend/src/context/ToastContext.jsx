import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast container floating at bottom right */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: CheckCircle2,
              error: AlertCircle,
              warning: AlertTriangle,
              info: Info,
            };
            const Icon = icons[toast.type] || Info;

            const borderColors = {
              success: 'border-status-success/40 bg-[#0D1C12]/95 text-status-success shadow-glow-sm',
              error: 'border-status-critical/40 bg-[#200F12]/95 text-status-critical shadow-glow-critical',
              warning: 'border-status-warning/40 bg-[#1F190D]/95 text-status-warning shadow-glow-warning',
              info: 'border-status-info/40 bg-[#0D1824]/95 text-status-info',
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto rounded-2xl border p-4 backdrop-blur-md shadow-2xl flex items-start gap-3.5 ${
                  borderColors[toast.type] || borderColors.info
                }`}
              >
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                
                <div className="flex-1 min-w-0">
                  {toast.title && (
                    <h4 className="text-sm font-semibold text-text-primary tracking-tight">
                      {toast.title}
                    </h4>
                  )}
                  {toast.message && (
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
                  aria-label="Dismiss toast"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
