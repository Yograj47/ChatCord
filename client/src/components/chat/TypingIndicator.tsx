import React from 'react';

interface TypingIndicatorProps {
  users?: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  users = ['Alex'],
}) => {
  const label =
    users.length === 1
      ? `${users[0]} is typing...`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing...`
      : 'Multiple people are typing...';

  return (
    <div className="flex items-center space-x-2 px-4 py-1 text-xs text-zinc-400">
      <div className="flex space-x-1 items-center">
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
      </div>
      <span className="text-[11px] font-medium text-zinc-400">{label}</span>
    </div>
  );
};