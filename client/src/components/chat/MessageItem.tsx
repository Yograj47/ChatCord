import React from 'react';
import { MessageSquare, Pin, CornerDownRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageActions } from './MessageActions';

export interface Reaction {
    emoji: string;
    count: number;
    users: string[];
    hasReacted?: boolean;
}

export interface QuotedReply {
    messageId: string;
    senderName: string;
    content: string;
}

export interface Message {
    id: string;
    senderName: string;
    senderInitials: string;
    senderAvatarBg?: string;
    content: string;
    timestamp: string;
    isSelf?: boolean;
    replyCount?: number;
    lastReplyTime?: string;
    reactions?: Reaction[];
    isPinned?: boolean;
    replyingTo?: QuotedReply | null; // Quoted parent message context
}

interface MessageItemProps {
    message: Message;
    onReact?: (messageId: string, emoji: string) => void;
    onReplyInInput?: (message: Message) => void;
    onPinMessage?: (messageId: string) => void;
    onDeleteMessage?: (messageId: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
    message,
    onReact,
    onReplyInInput,
    onPinMessage,
    onDeleteMessage,
}) => {
    const navigate = useNavigate();
    const { roomId } = useParams<{ roomId: string }>();

    const handleOpenThread = () => {
        navigate(`/app/rooms/${roomId || 'dev-general'}/threads/${message.id}`);
    };

    const handleToggleReaction = (emoji: string) => {
        if (onReact) onReact(message.id, emoji);
    };

    return (
        <div className="relative group flex space-x-3 px-4 py-2 hover:bg-zinc-900/50 rounded-lg transition-colors">
            {/* Sender Avatar */}
            <div
                className={`w-8 h-8 rounded-full ${message.senderAvatarBg || 'bg-indigo-600'
                    } border border-zinc-700/50 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5`}
            >
                {message.senderInitials}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2">
                    <span className="text-xs font-semibold text-zinc-200 hover:underline cursor-pointer">
                        {message.senderName}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                        {message.timestamp}
                    </span>
                    {message.isPinned && (
                        <span className="inline-flex items-center text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-mono">
                            <Pin className="h-2.5 w-2.5 mr-0.5" /> Pinned
                        </span>
                    )}
                </div>

                {/* --- Quoted Reply Highlight Box --- */}
                {message.replyingTo && (
                    <div className="flex items-center space-x-1.5 mt-1 mb-1 px-2.5 py-1 bg-zinc-800/40 border-l-2 border-indigo-500 rounded-r text-[11px] text-zinc-400 max-w-xl truncate">
                        <CornerDownRight className="h-3 w-3 text-indigo-400 shrink-0" />
                        <span className="font-semibold text-zinc-300 shrink-0">
                            {message.replyingTo.senderName}:
                        </span>
                        <span className="truncate italic text-zinc-400">
                            {message.replyingTo.content}
                        </span>
                    </div>
                )}

                {/* Message Body */}
                <p className="text-xs text-zinc-300 leading-relaxed break-words mt-0.5">
                    {message.content}
                </p>

                {/* Reactions List */}
                {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {message.reactions.map((reaction, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleToggleReaction(reaction.emoji)}
                                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${reaction.hasReacted
                                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                                        : 'bg-[#141720] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                    }`}
                            >
                                <span>{reaction.emoji}</span>
                                <span className="text-[10px] font-bold">{reaction.count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Thread Replies Button */}
                {message.replyCount && message.replyCount > 0 ? (
                    <button
                        type="button"
                        onClick={handleOpenThread}
                        className="flex items-center space-x-1.5 mt-2 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                    >
                        <MessageSquare className="h-3 w-3" />
                        <span>
                            {message.replyCount}{' '}
                            {message.replyCount === 1 ? 'reply' : 'replies'}
                        </span>
                        {message.lastReplyTime && (
                            <span className="text-zinc-500 text-[10px] font-normal">
                                · Last reply {message.lastReplyTime}
                            </span>
                        )}
                    </button>
                ) : null}
            </div>

            {/* Action Toolbar */}
            <MessageActions
                message={message}
                onReact={onReact}
                onReplyInInput={onReplyInInput}
                onOpenThread={handleOpenThread}
                onPinMessage={onPinMessage}
                onDeleteMessage={onDeleteMessage}
            />
        </div>
    );
};