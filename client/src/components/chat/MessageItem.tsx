import React from 'react';

export interface Message {
    id: string;
    senderName: string;
    senderInitials: string;
    senderAvatarBg?: string;
    content: string;
    timestamp: string;
    isSelf?: boolean;
}

interface MessageItemProps {
    message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
    return (
        <div className="flex space-x-3 group px-4 py-1.5 hover:bg-zinc-900/40 rounded-lg transition-colors">
            <div
                className={`w-8 h-8 rounded-full ${message.senderAvatarBg || 'bg-indigo-600'
                    } border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5`}
            >
                {message.senderInitials}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2">
                    <span className="text-xs font-semibold text-zinc-200 hover:underline cursor-pointer">
                        {message.senderName}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{message.timestamp}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed wrap-break-word mt-0.5">
                    {message.content}
                </p>
            </div>
        </div>
    );
};