import { Loader2 } from 'lucide-react';

export function RoomFormActions({
  onCancel,
  isLoading,
  submitLabel,
}: {
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/80">
      <button
        type="button"
        disabled={isLoading}
        onClick={onCancel}
        className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        <span>{submitLabel}</span>
      </button>
    </div>
  );
}
