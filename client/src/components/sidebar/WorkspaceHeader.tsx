import React from 'react';
import { ChevronDown } from 'lucide-react';

interface WorkspaceHeaderProps {
  name: string;
  initials: string;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ name, initials }) => {
  return (
    <div className="p-3 border-b border-zinc-800/60 flex items-center justify-between">
      <button
        type="button"
        className="flex items-center space-x-2 text-xs font-bold text-zinc-100 hover:text-white truncate"
      >
        <div className="h-6 w-6 rounded bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] flex items-center justify-center shrink-0">
          {initials}
        </div>
        <span className="truncate">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
      </button>
    </div>
  );
};