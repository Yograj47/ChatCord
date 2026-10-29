import React, { useState } from 'react';
import { Hash, Users, Pin, Shield, Settings, Loader2 } from 'lucide-react';

interface Member {
  id: string;
  username: string;
  displayName: string;
  role: 'owner' | 'admin' | 'member';
}

interface ChatHeaderProps {
  roomName: string;
  topic?: string;
  members?: Member[];
  isLoadingMembers?: boolean;
  onOpenEdit?: () => void; // <-- Callback to open edit modal
  canManageRoom?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  roomName,
  topic = 'General discussion and updates',
  members = [],
  isLoadingMembers = false,
  onOpenEdit,
  canManageRoom = true,
}) => {
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isPinsOpen, setIsPinsOpen] = useState(false);

  return (
    <div className="relative z-20 h-12 border-b border-zinc-800/80 bg-[#0d0f14] px-4 flex items-center justify-between shrink-0">
      {/* Left: Room Info */}
      <div className="flex items-center space-x-2 min-w-0 flex-1 mr-4">
        <Hash className="h-4 w-4 text-indigo-400 shrink-0" />
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-100 truncate">{roomName}</h2>
          <span className="text-zinc-700 text-xs shrink-0">|</span>
          <p className="text-xs text-zinc-400 truncate hidden sm:block">{topic}</p>
        </div>
      </div>

      {/* Right: Actions (Members, Pins, Settings) */}
      <div className="flex items-center space-x-3 shrink-0 text-zinc-400 relative">
        {/* Members Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsMembersOpen(!isMembersOpen);
              setIsPinsOpen(false);
            }}
            className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${isMembersOpen
                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400'
                : 'bg-zinc-900 border-zinc-800 hover:text-zinc-200'
              }`}
          >
            <Users className="h-3.5 w-3.5 text-zinc-500" />
            <span>{members.length}</span>
          </button>

          {isMembersOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#111319] border border-zinc-800 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Room Members
                </span>
                <span className="text-[10px] text-zinc-500">{members.length} total</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {isLoadingMembers ? (
                  <div className="py-4 text-center text-xs text-zinc-500 flex items-center justify-center space-x-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    <span>Loading members...</span>
                  </div>
                ) : members.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500">
                    No members found.
                  </div>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/60 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                          {member.displayName?.charAt(0) || member.username.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-200 truncate">
                            {member.displayName || member.username}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">
                            @{member.username}
                          </div>
                        </div>
                      </div>

                      {member.role !== 'member' && (
                        <span className="flex items-center space-x-1 text-[10px] bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded capitalize shrink-0">
                          <Shield className="h-3 w-3" />
                          <span>{member.role}</span>
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Messages Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsPinsOpen(!isPinsOpen);
              setIsMembersOpen(false);
            }}
            className={`p-1.5 rounded-lg border transition-colors ${isPinsOpen
                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400'
                : 'bg-zinc-900 border-zinc-800 hover:text-zinc-200'
              }`}
            title="Pinned Messages"
          >
            <Pin className="h-4 w-4" />
          </button>

          {isPinsOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#111319] border border-zinc-800 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
                  Pinned Messages
                </span>
                <Pin className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="py-6 text-center">
                <p className="text-xs text-zinc-500">No pinned messages in this room yet.</p>
              </div>
            </div>
          )}
        </div>

        {/* Room Settings / Edit Button */}
        {canManageRoom && onOpenEdit && (
          <button
            type="button"
            onClick={onOpenEdit}
            className="p-1.5 rounded-lg border bg-zinc-900 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
            title="Room Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};