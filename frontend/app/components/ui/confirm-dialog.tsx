import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '~/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {variant === 'danger' && (
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-[#1E293B]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#64748B] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {description && (
          <p className="text-sm text-[#64748B] mb-6">{description}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-[44px] border border-[#E5E7EB] rounded-lg font-medium text-sm text-[#1E293B] hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 h-[44px] rounded-lg font-medium text-sm text-white transition-all disabled:opacity-50',
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-[#4A90D9] hover:bg-[#3B82F6]'
            )}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  return { isOpen, open, close };
}
