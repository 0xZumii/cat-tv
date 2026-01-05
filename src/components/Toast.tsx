import { X } from 'lucide-react';
import clsx from 'clsx';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in',
            'bg-white border-l-4',
            toast.type === 'success' ? 'border-happy' : 'border-sad'
          )}
        >
          <span className="text-lg">
            {toast.type === 'success' ? '✨' : '😿'}
          </span>
          <span className="text-text-main font-medium">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-2 text-text-soft hover:text-text-main transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
