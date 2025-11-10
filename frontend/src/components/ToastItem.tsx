import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { Toast } from '../types/toast';

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export default function ToastItem({ toast, onRemove }: ToastItemProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          icon: <CheckCircleIcon className="h-5 w-5 text-green-400" />,
          text: 'text-green-400',
        };
      case 'error':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          icon: <ExclamationCircleIcon className="h-5 w-5 text-red-400" />,
          text: 'text-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />,
          text: 'text-yellow-400',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          icon: <InformationCircleIcon className="h-5 w-5 text-blue-400" />,
          text: 'text-blue-400',
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`flex items-start gap-3 rounded-md ${styles.bg} border ${styles.border} px-4 py-3 shadow-lg animate-slide-in-right`}
      role="alert"
      data-testid={`toast-${toast.type}`}
    >
      <div className="shrink-0">{styles.icon}</div>
      <p className={`flex-1 text-sm ${styles.text}`}>{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-gray-400 hover:text-white transition-colors"
        aria-label="Close notification"
        data-testid="toast-close-button"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
