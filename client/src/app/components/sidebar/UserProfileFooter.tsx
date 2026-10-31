import { PresenceBadge } from '@/features/realtime/components/PresenceBadge';
import type { PresenceStatus } from '@/features/realtime/types/realtime.types';
import React from 'react';

interface UserProfileFooterProps {
  displayName: string;
  initials: string;
  status: PresenceStatus;
}

export const UserProfileFooter: React.FC<UserProfileFooterProps> = ({
  displayName,
  initials,
  status,
}) => {
  return (
    <div className="p-3 bg-background border-t border-zinc-800/80 flex items-center justify-between">
      <div className="flex items-center space-x-2 min-w-0">
        <div className="relative shrink-0">
          <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-300 text-xs font-bold">
            {initials}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0a0b0e] ${
              status === 'online' ? 'bg-emerald-400' : 'bg-zinc-500'
            }`}
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-200 truncate">{displayName}</p>
          <PresenceBadge status={status} />
        </div>
      </div>
      <span className="font-mono text-[9px] text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded shrink-0">
        ChatCord
      </span>
    </div>
  );
};
