import React from 'react';
import { Search } from 'lucide-react';

interface SidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const SidebarSearch: React.FC<SidebarSearchProps> = ({ value, onChange }) => {
  return (
    <div className="p-3">
      <div className="relative">
        <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search rooms..."
          className="w-full bg-[#151821] border border-zinc-800/80 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
        />
      </div>
    </div>
  );
};