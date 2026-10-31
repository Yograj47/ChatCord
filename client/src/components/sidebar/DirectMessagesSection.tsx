import React from 'react';
import { Plus } from 'lucide-react';
import { PresenceBadge } from '../common/PresenceBadge';
import type { PresenceStatus } from '../../types/realtime';

export interface DMItem {
    id: string;
    name: string;
    status: PresenceStatus;
}

interface DirectMessagesSectionProps {
    dms: DMItem[];
    activeDmId?: string;
    onSelectDm: (id: string) => void;
    onNewDm: () => void;
}

export const DirectMessagesSection: React.FC<DirectMessagesSectionProps> = ({
    dms,
    activeDmId,
    onSelectDm,
    onNewDm,
}) => {
    return (
        <div>
            <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <span>Private Chats</span>
                <button
                    type="button"
                    onClick={onNewDm}
                    title="Start Direct Message"
                    className="text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
            <div className="space-y-0.5">
                {dms.map((dm) => {
                    const isActive = dm.id === activeDmId;
                    return (
                        <button
                            key={dm.id}
                            type="button"
                            onClick={() => onSelectDm(dm.id)}
                            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-xs transition-colors ${isActive
                                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                                    : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            <span className="truncate">{dm.name}</span>
                            <PresenceBadge status={dm.status} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
