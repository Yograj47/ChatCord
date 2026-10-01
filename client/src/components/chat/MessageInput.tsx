import React, { useState } from 'react';
import { Paperclip, Send, Smile } from 'lucide-react';

interface MessageInputProps {
    channelName: string;
    onSendMessage: (content: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    channelName,
    onSendMessage,
}) => {
    const [content, setContent] = useState('');

    const handleSend = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSendMessage(content);
        setContent('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    return (
        <div className="p-3 bg-[#0d0f14] border-t border-zinc-800/80 shrink-0">
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
                    placeholder={`Message #${channelName}...`}
                    className="w-full bg-[#151821] border border-zinc-800/90 rounded-xl pl-10 pr-20 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
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