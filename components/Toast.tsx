
import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast, ToastType } from '../contexts/ToastContext';

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
};

const TOAST_CLASSES: Record<ToastType, string> = {
  success: 'toast--success',
  error: 'toast--error',
  info: 'toast--info',
};

const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { id, message, type } = toast;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Start exit animation
      setIsExiting(true);
      // Remove from DOM after animation
      setTimeout(() => onDismiss(id), 300); 
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);
  
  const handleDismiss = () => {
      setIsExiting(true);
      setTimeout(() => onDismiss(id), 300);
  }

  const Icon = ICONS[type];
  const toastClass = TOAST_CLASSES[type];

  return (
    <div className={`toast ${toastClass} ${isExiting ? 'exit' : 'enter'}`} role="alert" aria-live="assertive">
      <div className="toast-icon">
        <Icon className="w-6 h-6" />
      </div>
      <p className="toast-message">{message}</p>
      <button onClick={handleDismiss} className="toast-close-btn" aria-label="Dismiss">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ToastComponent;
