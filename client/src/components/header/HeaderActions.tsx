import React from 'react';
import { Plus } from 'lucide-react';

interface HeaderActionsProps {
  onNewAction: () => void;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({ onNewAction }) => {
  return (
    <div className="flex items-center space-x-3 shrink-0">
      <button
        type="button"
        onClick={onNewAction}
        className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>New</span>
      </button>
    </div>
  );
};