import React, { useState, useRef, useEffect } from 'react';
import {
    Smile,
    MessageSquare,
    MoreHorizontal,
    Pin,
    Trash2,
    CornerUpLeft,
} from 'lucide-react';
import { type Message } from './MessageItem';

interface MessageActionsProps {
    message: Message;
    onReact?: (messageId: string, emoji: string) => void;
    onReplyInInput?: (message: Message) => void;
    onOpenThread?: () => void;
    onPinMessage?: (messageId: string) => void;
    onDeleteMessage?: (messageId: string) => void;
}

const QUICK_EMOJIS = ['👍', '❤️️', '🔥', '🚀', '👀'];

export const MessageActions: React.FC<MessageActionsProps> = ({
    message,
    onReact,
    onReplyInInput,
    onOpenThread,
    onPinMessage,
    onDeleteMessage,
}) => {
    const [showQuickPicker, setShowQuickPicker] = useState(false);
    const [showDotMenu, setShowDotMenu] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setShowQuickPicker(false);
                setShowDotMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleReaction = (emoji: string) => {
        if (onReact) onReact(message.id, emoji);
        setShowQuickPicker(false);
        setShowDotMenu(false);
    };

    const handleSelectReply = () => {
        if (onReplyInInput) onReplyInInput(message);
        setShowDotMenu(false);
    };

    return (
        <div
            ref={containerRef}
            className="absolute right-2 sm:right-6 -top-2 hidden group-hover:flex items-center bg-[#151821] border border-zinc-800 shadow-lg rounded-lg px-1 py-0.5 space-x-1 z-30"
        >
            {/* Quick Emoji Reaction Trigger */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => {
                        setShowQuickPicker(!showQuickPicker);
                        setShowDotMenu(false);
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    title="Add Reaction"
                >
                    <Smile className="h-3.5 w-3.5" />
                </button>

                {/* Emoji Popover */}
                {showQuickPicker && (
                    <div className="absolute right-0 top-8 bg-[#1a1d26] border border-zinc-800 shadow-2xl rounded-lg p-1.5 flex items-center space-x-1 z-50">
                        {QUICK_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(emoji)}
                                className="p-1 hover:bg-zinc-800 rounded text-sm transition-transform hover:scale-125"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Reply in Thread Drawer */}
            <button
                type="button"
                onClick={onOpenThread}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                title="Reply in Thread"
            >
                <MessageSquare className="h-3.5 w-3.5" />
            </button>

            {/* Dot Menu Dropdown */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => {
                        setShowDotMenu(!showDotMenu);
                        setShowQuickPicker(false);
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    title="More options"
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                {showDotMenu && (
                    <div className="absolute right-0 top-8 w-44 bg-[#161922] border border-zinc-800 shadow-2xl rounded-lg py-1 text-xs text-zinc-300 z-50">
                        <button
                            type="button"
                            onClick={handleSelectReply}
                            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors"
                        >
                            <CornerUpLeft className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Reply</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowQuickPicker(true);
                                setShowDotMenu(false);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-zinc-800 transition-colors"
                        >
                            <Smile className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Add Reaction</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (onPinMessage) onPinMessage(message.id);
                                setShowDotMenu(false);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-zinc-800 transition-colors"
                        >
                            <Pin className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{message.isPinned ? 'Unpin Message' : 'Pin Message'}</span>
                        </button>

                        <div className="h-px bg-zinc-800 my-1" />

                        <button
                            type="button"
                            onClick={() => {
                                if (onDeleteMessage) onDeleteMessage(message.id);
                                setShowDotMenu(false);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                            <span>Delete Message</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};