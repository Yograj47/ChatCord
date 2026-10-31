import { useEffect, useRef } from "react";
import {
  useMessageDetail,
  useMessages,
  useMessageMutations,
} from "../../hooks/useMessages";
import { MessageInput } from "./MessageInput";
import { useTyping } from '../../hooks/useTyping';
import { TypingIndicator } from './TypingIndicator';

interface Props {
  roomId: string;
  userId: string;
  messageId: string;
  canSend: boolean;
  onClose: () => void;
  nameFor: (id: string) => string;
}
export function MessageReplies({
  roomId,
  userId,
  messageId,
  canSend,
  onClose,
  nameFor,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const parent = useMessageDetail(roomId, userId, messageId);
  const replies = useMessages(roomId, userId, true, "", messageId);
  const { send } = useMessageMutations(roomId, userId);
  const typing = useTyping(roomId, userId, canSend);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      aria-labelledby="replies-title"
      className="w-full max-w-2xl max-h-[85vh] rounded-xl border border-zinc-700 bg-[#151821] p-4 text-zinc-200 backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between">
        <h2 id="replies-title">Replies</h2>
        <button aria-label="Close replies" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="my-4 border-l-2 border-indigo-500 p-2 text-sm">
        {parent.isPending
          ? "Loading…"
          : (parent.data?.content ?? "Message unavailable")}
      </p>
      {replies.isPending && <p role="status">Loading replies…</p>}
      {replies.isError && (
        <p role="alert">
          Could not load replies.{" "}
          <button onClick={() => void replies.refetch()}>Retry</button>
        </p>
      )}
      {replies.hasNextPage && (
        <button
          disabled={replies.isFetchingNextPage}
          onClick={() => void replies.fetchNextPage()}
        >
          Load older replies
        </button>
      )}
      <ol className="max-h-[40vh] space-y-4 overflow-y-auto py-4">
        {replies.messages.map((reply) => (
          <li key={reply._id} className="text-sm">
            <span className="text-xs text-indigo-300">
              {nameFor(reply.senderId)} ·{" "}
              {new Date(reply.createdAt).toLocaleString()}
            </span>
            <p className="whitespace-pre-wrap break-words">
              {reply.content}
              {reply.editedAt && !reply.deletedAt ? " (edited)" : ""}
            </p>
          </li>
        ))}
      </ol>
      {!replies.isPending && !replies.messages.length && (
        <p className="pb-4 text-sm text-zinc-400">No replies yet.</p>
      )}
      <TypingIndicator users={typing.typingUserIds.map(nameFor)} />
      <MessageInput
        onTypingChange={typing.onTypingChange}
        channelName="Replies"
        disabled={!canSend || !parent.data || Boolean(parent.data.deletedAt)}
        disabledReason={
          !canSend
            ? "Connect to this conversation to reply."
            : parent.data?.deletedAt
              ? "This message was deleted."
              : undefined
        }
        onSendMessage={async (content) => {
          try {
            await send.mutateAsync({ content, replyTo: messageId });
            return true;
          } catch {
            return false;
          }
        }}
      />
    </dialog>
  );
}
