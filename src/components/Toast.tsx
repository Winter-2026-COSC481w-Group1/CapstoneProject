import { useCallback, useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  const dismissToast = useCallback(() => {
    setIsVisible(false);
    window.setTimeout(() => {
      onClose(toast.id);
    }, 300);
  }, [onClose, toast.id]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dismissToast();
    }, 10000); // 10 seconds

    return () => window.clearTimeout(timer);
  }, [dismissToast]);

  const isSuccess = toast.type === 'success';
  const bgColor = isSuccess ? 'bg-emerald-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-emerald-200' : 'border-red-200';
  const titleColor = isSuccess ? 'text-emerald-900' : 'text-red-900';
  const messageColor = isSuccess ? 'text-emerald-700' : 'text-red-700';
  const iconColor = isSuccess ? 'text-emerald-600' : 'text-red-600';

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-xl p-4 shadow-lg flex items-start gap-3 transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {isSuccess ? (
        <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      ) : (
        <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      )}
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-sm ${titleColor}`}>{toast.title}</h4>
        <p className={`text-sm ${messageColor} mt-0.5`}>{toast.message}</p>
      </div>

      <button
        onClick={dismissToast}
        className={`flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors ${messageColor}`}
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
