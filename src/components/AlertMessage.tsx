import { useEffect, useState } from 'react';

interface AlertMessageProps {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  onClose?: () => void;
  autoDismiss?: number;
}

const iconMap = {
  error: 'fa-solid fa-circle-exclamation',
  warning: 'fa-solid fa-triangle-exclamation',
  success: 'fa-solid fa-circle-check',
  info: 'fa-solid fa-circle-info',
};

const styleMap = {
  error: 'bg-rose-50 border-rose-200 text-rose-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function AlertMessage({
  type,
  message,
  onClose,
  autoDismiss = 4000,
}: AlertMessageProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm animate-fade-in ${styleMap[type]}`}
    >
      <i className={`${iconMap[type]} shrink-0`}></i>
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </div>
  );
}
