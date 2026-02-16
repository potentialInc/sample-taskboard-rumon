import { useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function Drawer({
  isOpen,
  onClose,
  children,
  footer,
  width = 'w-[400px]',
}: DrawerProps) {
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

  return (
    <div
      className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px] transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`absolute right-0 top-0 h-full ${width} bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface DrawerHeaderProps {
  onClose: () => void;
  children: React.ReactNode;
}

export function DrawerHeader({ onClose, children }: DrawerHeaderProps) {
  return (
    <div className="relative">
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-[#64748B] hover:text-[#1E293B] transition-colors p-1 z-10"
      >
        <Icon icon="solar:close-circle-linear" width={24} height={24} />
      </button>
      {children}
    </div>
  );
}
