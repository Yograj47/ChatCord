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
    isMobileActive?: boolean;
    onCloseMobileMenu?: () => void;
    onReact?: (messageId: string, emoji: string) => void;
    onReplyInInput?: (message: Message) => void;
    onOpenThread?: () => void;
    onPinMessage?: (messageId: string) => void;
    onDeleteMessage?: (messageId: string) => void;
}

const QUICK_EMOJIS = ['👍', '❤', '🔥', '🚀', '👀'];

export const MessageActions: React.FC<MessageActionsProps> = ({
    message,
    isMobileActive = false,
    onCloseMobileMenu,
    onReact,
    onReplyInInput,
    onOpenThread,
    onPinMessage,
    onDeleteMessage,
}) => {
    const [showQuickPicker, setShowQuickPicker] = useState(false);
    const [showDotMenu, setShowDotMenu] = useState(false);

    // Position state: true if opening upward, false if opening downward
    const [openUpward, setOpenUpward] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Close options when clicking outside
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

    // Calculate viewport position before opening menus
    const calculatePosition = (targetElement: HTMLElement) => {
        const rect = targetElement.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If less than 220px space below, render upward
        setOpenUpward(spaceBelow < 220);
    };

    const closeAll = () => {
        setShowQuickPicker(false);
        setShowDotMenu(false);
        if (onCloseMobileMenu) onCloseMobileMenu();
    };

    const handleToggleReaction = (emoji: string) => {
        if (onReact) onReact(message.id, emoji);
        closeAll();
    };

    const handleSelectReplyInInput = () => {
        if (onReplyInInput) onReplyInInput(message);
        closeAll();
    };

    const handleOpenThread = () => {
        if (onOpenThread) onOpenThread();
        closeAll();
    };

    const handlePin = () => {
        if (onPinMessage) onPinMessage(message.id);
        closeAll();
    };

    const handleDelete = () => {
        if (onDeleteMessage) onDeleteMessage(message.id);
        closeAll();
    };

    const isVisible = isMobileActive || showQuickPicker || showDotMenu;

    return (
        <div
            ref={containerRef}
            className={`absolute right-2 sm:right-6 -top-3 ${isVisible ? 'flex' : 'hidden group-hover:flex'
                } items-center bg-[#151821] border border-zinc-800 shadow-xl rounded-lg px-1 py-0.5 space-x-1 z-30`}
        >
            {/* Quick Emoji Reaction */}
            <div className="relative">
                <button
                    type="button"
                    onClick={(e) => {
                        calculatePosition(e.currentTarget);
                        setShowQuickPicker(!showQuickPicker);
                        setShowDotMenu(false);
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    title="Add Reaction"
                >
                    <Smile className="h-3.5 w-3.5" />
                </button>

                {/* Quick Emoji Popover */}
                {showQuickPicker && (
                    <div
                        className={`absolute right-0 ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
                            } bg-[#1a1d26] border border-zinc-800 shadow-2xl rounded-lg p-1.5 flex items-center space-x-1 z-50`}
                    >
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

            {/* Direct Reply Button */}
            <button
                type="button"
                onClick={handleSelectReplyInInput}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                title="Reply directly"
            >
                <CornerUpLeft className="h-3.5 w-3.5" />
            </button>

            {/* Thread Reply Button */}
            <button
                type="button"
                onClick={handleOpenThread}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                title="Reply in Thread"
            >
                <MessageSquare className="h-3.5 w-3.5" />
            </button>

            {/* 3-Dot More Menu */}
            <div className="relative">
                <button
                    type="button"
                    onClick={(e) => {
                        calculatePosition(e.currentTarget);
                        setShowDotMenu(!showDotMenu);
                        setShowQuickPicker(false);
                    }}
                    className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    title="More options"
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                {/* 3-Dot Dropdown Menu */}
                {showDotMenu && (
                    <div
                        className={`absolute right-0 ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
                            } w-44 bg-[#161922] border border-zinc-800 shadow-2xl rounded-lg py-1 text-xs text-zinc-300 z-50`}
                    >
                        <button
                            type="button"
                            onClick={handleSelectReplyInInput}
                            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors"
                        >
                            <CornerUpLeft className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Reply</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenThread}
                            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-zinc-800 transition-colors"
                        >
                            <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Reply in Thread</span>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                calculatePosition(e.currentTarget);
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
                            onClick={handlePin}
                            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-zinc-800 transition-colors"
                        >
                            <Pin className="h-3.5 w-3.5 text-zinc-400" />
                            <span>{message.isPinned ? 'Unpin Message' : 'Pin Message'}</span>
                        </button>

                        <div className="h-px bg-zinc-800 my-1" />

                        <button
                            type="button"
                            onClick={handleDelete}
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