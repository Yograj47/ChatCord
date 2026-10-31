import { useMessageDetail } from "../../hooks/useMessages";

export function MessageQuote({
  roomId,
  userId,
  messageId,
}: {
  roomId: string;
  userId: string;
  messageId: string;
}) {
  const { data, isPending } = useMessageDetail(roomId, userId, messageId);
  return (
    <div className="my-1 rounded border-l-2 border-indigo-500 bg-zinc-800/40 px-3 py-1 text-xs text-zinc-400">
      Reply to:{" "}
      {isPending
        ? "Loading message…"
        : data?.deletedAt
          ? "[Message deleted]"
          : (data?.content ?? "Message unavailable")}
    </div>
  );
}
