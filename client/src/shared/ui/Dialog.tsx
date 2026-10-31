import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

type DialogProps = Omit<ComponentPropsWithoutRef<'dialog'>, 'open' | 'onCancel' | 'onClose'> & {
  isOpen?: boolean;
  onClose: () => void;
  isPending?: boolean;
};

export function Dialog({
  isOpen = true,
  onClose,
  isPending = false,
  children,
  ...props
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !isOpen) return;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      // Restore the invoking control when it still exists after navigation or a mutation.
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [isOpen]);

  return (
    <dialog
      {...props}
      ref={ref}
      aria-busy={isPending || undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!isPending) onClose();
      }}
    >
      {isOpen ? children : null}
    </dialog>
  );
}
