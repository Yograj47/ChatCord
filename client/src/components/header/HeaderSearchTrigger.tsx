import React from 'react';
import { Search, Command } from 'lucide-react';

interface HeaderSearchTriggerProps {
  onOpenSearch: () => void;
  placeholder?: string;
}

export const HeaderSearchTrigger: React.FC<HeaderSearchTriggerProps> = ({
  onOpenSearch,
  placeholder = 'Search messages or commands...',
}) => {
  return (
    <div className="flex-1 max-w-sm mx-4">
      <button
        type="button"
        onClick={onOpenSearch}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-[#13161c] hover:bg-zinc-800/80 border border-zinc-800 rounded-lg text-xs text-zinc-400 transition-colors group"
      >
        <div className="flex items-center space-x-2 truncate">
          <Search className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
          <span className="truncate">{placeholder}</span>
        </div>
        <div className="hidden sm:flex items-center space-x-1 font-mono text-[10px] text-zinc-500 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0">
          <Command className="h-2.5 w-2.5" />
          <span>K</span>
        </div>
      </button>
    </div>
  );
};