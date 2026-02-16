import { useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: string;
  iconBgColor?: string;
  iconColor?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  iconBgColor = 'bg-[#4A90D9]/10',
  iconColor = 'text-[#4A90D9]',
  children,
  footer,
  width = 'w-[480px]',
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className={`${width} max-h-[90vh] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`w-9 h-9 rounded-lg ${iconBgColor} flex items-center justify-center ${iconColor}`}>
                <Icon icon={icon} width={20} height={20} />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-[#1E293B]">{title}</h3>
              {description && <p className="text-xs text-[#64748B]">{description}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1E293B] transition-colors p-1 -mr-1"
          >
            <Icon icon="solar:close-circle-linear" width={24} height={24} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3 flex-shrink-0 bg-[#F9FAFB]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
