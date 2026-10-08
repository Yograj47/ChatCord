import React, { useRef, useEffect } from 'react';
import { MessageItem, type Message } from './MessageItem';

interface MessageListProps {
    messages: Message[];
    onReact?: (messageId: string, emoji: string) => void;
    onReplyInInput?: (message: Message) => void;
    onPinMessage?: (messageId: string) => void;
    onDeleteMessage?: (messageId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    onReact,
    onReplyInInput,
    onPinMessage,
    onDeleteMessage,
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    return (
        <div className="flex-1 overflow-y-auto space-y-1 px-2 pt-6 pb-2 scrollbar-thin">
            {messages.map((msg) => (
                <MessageItem
                    key={msg.id}
                    message={msg}
                    onReact={onReact}
                    onReplyInInput={onReplyInInput}
                    onPinMessage={onPinMessage}
                    onDeleteMessage={onDeleteMessage}
                />
            ))}
            <div ref={bottomRef} />
        </div>
    );
};