
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, isConfirming = false }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div className="modal-content !max-w-md" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500"
          aria-label="Close confirmation"
        >
          <X className="w-6 h-6" />
        </button>

        <header className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <h2 id="confirmation-title" className="text-2xl font-bold text-slate-800 mt-4">{title}</h2>
            <p id="confirmation-message" className="text-slate-600 mt-2">{message}</p>
        </header>

        <footer className="flex justify-center items-center gap-4 mt-8">
            <button 
                type="button" 
                onClick={onClose} 
                className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300"
                disabled={isConfirming}
            >
                Cancel
            </button>
            <button 
                type="button" 
                onClick={onConfirm}
                className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:bg-red-400 disabled:cursor-not-allowed"
                disabled={isConfirming}
            >
              {isConfirming ? 'Deleting...' : 'Delete'}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;