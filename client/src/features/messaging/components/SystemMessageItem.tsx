import { LogIn, LogOut, PencilLine, Settings2, ShieldAlert } from 'lucide-react';
import type { Message } from '@/features/messaging/types/message.types';

export function SystemMessageItem({ message }: { message: Message }) {
  const event = message.systemEvent;
  const Icon =
    event === 'joined'
      ? LogIn
      : event === 'left' || event === 'expired'
        ? LogOut
        : event === 'removed'
          ? ShieldAlert
          : event === 'renamed'
            ? PencilLine
            : Settings2;
  const color =
    event === 'joined'
      ? 'text-emerald-400/70'
      : event === 'removed'
        ? 'text-amber-400/70'
        : 'text-indigo-300/60';
  return (
    <div
      className="flex items-start justify-center gap-2 px-6 py-2"
      role="note"
      aria-label="Room activity"
    >
      <Icon className={`mt-0.5 size-3 shrink-0 ${color}`} aria-hidden="true" />
      <p className="min-w-0 break-words text-center text-[11px] leading-relaxed text-zinc-500">
        {message.content}
        <span className="ml-2 whitespace-nowrap text-[10px] text-zinc-600">
          {message.timestamp}
        </span>
      </p>
    </div>
  );
}
