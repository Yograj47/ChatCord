import React, { useState } from 'react';
import { Paperclip, Send, Smile, X, CornerDownRight } from 'lucide-react';

export interface ReplyingToState {
    messageId: string;
    senderName: string;
    content: string;
}

interface MessageInputProps {
    channelName: string;
    onSendMessage: (content: string, replyingTo?: ReplyingToState | null) => void;
    replyingTo?: ReplyingToState | null;
    onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    channelName,
    onSendMessage,
    replyingTo,
    onCancelReply,
}) => {
    const [content, setContent] = useState('');

    const handleSend = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!content.trim()) return;

        // Send content with current reply metadata
        onSendMessage(content, replyingTo);

        // Clear input field and close reply banner
        setContent('');
        if (onCancelReply) {
            onCancelReply();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCloseReply = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onCancelReply) {
            onCancelReply();
        }
    };

    return (
        <div className="p-3 bg-[#0d0f14] border-t border-zinc-800/80 shrink-0">
            {/* Active Reply Banner */}
            {replyingTo && (
                <div className="flex items-center justify-between bg-[#151821] border-t border-x border-zinc-800 px-3 py-1.5 rounded-t-xl text-xs">
                    <div className="flex items-center space-x-2 text-zinc-400 truncate min-w-0">
                        <CornerDownRight className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="text-zinc-500 shrink-0">Replying to</span>
                        <span className="font-semibold text-zinc-200 shrink-0">
                            {replyingTo.senderName}:
                        </span>
                        <span className="truncate text-zinc-400">{replyingTo.content}</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCloseReply}
                        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors shrink-0 ml-2"
                        title="Cancel reply"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Composer Input Form */}
            <form onSubmit={handleSend} className="relative flex items-center">
                <button
                    type="button"
                    className="absolute left-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Attach File"
                >
                    <Paperclip className="h-4 w-4" />
                </button>

                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        replyingTo
                            ? `Reply to ${replyingTo.senderName}...`
                            : `Message #${channelName}...`
                    }
                    className={`w-full bg-[#151821] border border-zinc-800/90 pl-10 pr-20 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors ${replyingTo ? 'rounded-b-xl border-t-0' : 'rounded-xl'
                        }`}
                />

                <div className="absolute right-3 flex items-center space-x-2">
                    <button
                        type="button"
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Emoji"
                    >
                        <Smile className="h-4 w-4" />
                    </button>
                    <button
                        type="submit"
                        disabled={!content.trim()}
                        className={`p-1.5 rounded-lg text-white transition-colors ${content.trim()
                                ? 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                    >
                        <Send className="h-3.5 w-3.5" />
                    </button>
                </div>
            </form>
        </div>
    );
};