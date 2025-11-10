
import React from 'react';
import { useToast } from '../contexts/ToastContext';
import ToastComponent from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) {
      return null;
  }

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
