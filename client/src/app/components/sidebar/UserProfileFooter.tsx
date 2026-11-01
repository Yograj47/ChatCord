import { PresenceBadge } from '@/features/realtime/components/PresenceBadge';
import type { PresenceStatus } from '@/features/realtime/types/realtime.types';
import React from 'react';

interface UserProfileFooterProps {
  username: string;
  initials: string;
  status: PresenceStatus;
  children?: React.ReactNode;
}

export const UserProfileFooter: React.FC<UserProfileFooterProps> = ({
  username,
  initials,
  status,
  children,
}) => {
  return (
    <div className="p-3 bg-background border-t border-zinc-800/80">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-300 text-xs font-bold">
              {initials}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">{username}</p>
            <PresenceBadge status={status} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
