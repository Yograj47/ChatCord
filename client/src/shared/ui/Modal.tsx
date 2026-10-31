import { Dialog } from '@/shared/ui/Dialog';
import { X } from 'lucide-react';
import React, { useId } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  maxWidth?: string;
  children: React.ReactNode;
  isPending?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  maxWidth = 'max-w-lg',
  children,
  isPending = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      isPending={isPending}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] ${maxWidth} overflow-y-auto bg-card text-zinc-100 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-md`}
    >
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
              {icon}
            </div>
          )}
          <div>
            <h2
              id={titleId}
              className="text-base font-semibold text-zinc-100 font-mono tracking-wider"
            >
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-xs text-zinc-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          disabled={isPending}
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800/50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {children}
    </Dialog>
  );
};
