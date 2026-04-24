import React from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastContext, ToastType } from '../context/ToastContext';

const toastStyles: Record<ToastType, { container: string; icon: React.ReactNode; text: string }> = {
  success: {
    container: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    icon: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
  },
  error: {
    container: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    icon: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    icon: <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />,
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: <Info size={18} className="text-blue-500 flex-shrink-0" />,
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    /*
     * aria-live="assertive" for errors (need immediate attention), "polite"
     * for informational toasts. Because we mix types in one container we use
     * role="log" which implies aria-live="polite" and lets the browser batch
     * announcements rather than interrupting the user mid-sentence.
     */
    <div
      role="log"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map(toast => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg pointer-events-auto ${style.container}`}
          >
            <span className="mt-0.5">{style.icon}</span>
            <p className={`flex-1 text-sm font-medium ${style.text}`}>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 mt-0.5"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
