import React from 'react';
import { Hash, Users, Bell, Pin } from 'lucide-react';

interface ChatHeaderProps {
  roomName: string;
  topic?: string;
  memberCount?: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  roomName,
  topic = 'General discussion and updates',
  memberCount = 12,
}) => {
  return (
    <div className="h-12 border-b border-zinc-800/80 bg-[#0d0f14] px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-2 min-w-0">
        <Hash className="h-4 w-4 text-indigo-400 shrink-0" />
        <h2 className="text-sm font-semibold text-zinc-100 truncate">{roomName}</h2>
        <span className="text-zinc-700 text-xs shrink-0">|</span>
        <p className="text-xs text-zinc-400 truncate hidden sm:block">{topic}</p>
      </div>

      <div className="flex items-center space-x-3 shrink-0 text-zinc-400">
        <div className="hidden md:flex items-center space-x-1 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
          <Users className="h-3.5 w-3.5 text-zinc-500" />
          <span>{memberCount}</span>
        </div>
        <button type="button" className="hover:text-zinc-200 transition-colors">
          <Pin className="h-4 w-4" />
        </button>
        <button type="button" className="hover:text-zinc-200 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};