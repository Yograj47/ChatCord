import { useState } from "react";
import {
  Smile,
  CornerUpLeft,
  Pencil,
  Trash2,
  MessageSquare,
} from "lucide-react";
import type { Message } from "./MessageItem";

interface MessageActionsProps {
  message: Message;
  isMobileActive?: boolean;
  onCloseMobileMenu?: () => void;
  onReact?: (messageId: string, emoji: string) => void;
  onReplyInInput?: (message: Message) => void;
  onOpenThread?: () => void;
  onPinMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string) => void;
}

export function MessageActions({
  message,
  isMobileActive,
  onCloseMobileMenu,
  onReact,
  onReplyInInput,
  onOpenThread,
  onEditMessage,
  onDeleteMessage,
}: MessageActionsProps) {
  const [picker, setPicker] = useState(false);
  if (message.isDeleted) return null;
  const style =
    "p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded";
  return (
    <div
      className={`absolute right-2 -top-3 items-center rounded-lg border border-zinc-700 bg-[#151821] shadow-xl z-30 ${isMobileActive || picker ? "flex" : "flex opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}
    >
      {onReact && (
        <div className="relative">
          <button
            aria-label="Add reaction"
            title="Add reaction"
            className={style}
            onClick={() => setPicker(!picker)}
          >
            <Smile size={15} />
          </button>
          {picker && (
            <div className="absolute top-full right-0 mt-1 flex rounded border border-zinc-700 bg-zinc-900 p-1">
              {["👍", "❤", "🔥", "🚀", "👀"].map((emoji) => (
                <button
                  key={emoji}
                  aria-label={`React ${emoji}`}
                  className="p-1"
                  onClick={() => {
                    onReact(message.id, emoji);
                    setPicker(false);
                    onCloseMobileMenu?.();
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {onReplyInInput && (
        <button
          aria-label="Reply directly"
          title="Reply directly"
          className={style}
          onClick={() => {
            onReplyInInput(message);
            onCloseMobileMenu?.();
          }}
        >
          <CornerUpLeft size={15} />
        </button>
      )}
      {onOpenThread && (
        <button
          aria-label="View replies"
          title="View replies"
          className={style}
          onClick={onOpenThread}
        >
          <MessageSquare size={15} />
        </button>
      )}
      {message.isSelf && onEditMessage && (
        <button
          aria-label="Edit message"
          title="Edit message"
          className={style}
          onClick={() => onEditMessage(message.id)}
        >
          <Pencil size={15} />
        </button>
      )}
      {message.isSelf && onDeleteMessage && (
        <button
          aria-label="Delete message"
          title="Delete message"
          className={style}
          onClick={() => onDeleteMessage(message.id)}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
