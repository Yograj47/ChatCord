import { useEffect, useRef, useState } from "react";
import type { StoredMessage } from "../../types/message";
import { useMessageMutations } from "../../hooks/useMessages";

interface Props {
  message: StoredMessage;
  roomId: string;
  userId: string;
  mode: "edit" | "delete";
  onClose: () => void;
}
export function MessageDialog({
  message,
  roomId,
  userId,
  mode,
  onClose,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [content, setContent] = useState(message.content);
  const { edit, remove } = useMessageMutations(roomId, userId);
  const pending = edit.isPending || remove.isPending;
  const error = edit.error || remove.error;
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const submit = async () => {
    try {
      if (mode === "edit")
        await edit.mutateAsync({ id: message._id, content: content.trim() });
      else await remove.mutateAsync(message._id);
      onClose();
    } catch {
      /* Keep the dialog and draft available after a failed action. */
    }
  };
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        if (pending) event.preventDefault();
        else onClose();
      }}
      aria-labelledby="message-dialog-title"
      className="w-full max-w-lg rounded-xl border border-zinc-700 bg-[#151821] p-6 text-zinc-200 backdrop:bg-black/60"
    >
      <h2 id="message-dialog-title" className="mb-4 font-semibold">
        {mode === "edit" ? "Edit message" : "Delete message?"}
      </h2>
      {mode === "edit" ? (
        <textarea
          aria-label="Edit message content"
          maxLength={4000}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="min-h-28 w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-sm"
        />
      ) : (
        <p className="text-sm text-zinc-400">
          Your message text and reactions will be removed. Replies will keep a
          deleted-message reference.
        </p>
      )}
      {Boolean(error) && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error instanceof Error
            ? error.message
            : "Could not complete this action."}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-3">
        <button disabled={pending} onClick={onClose}>
          Cancel
        </button>
        <button
          disabled={pending || (mode === "edit" && !content.trim())}
          onClick={() => void submit()}
          className="rounded bg-indigo-600 px-3 py-2 disabled:opacity-50"
        >
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save changes"
              : "Confirm delete"}
        </button>
      </div>
    </dialog>
  );
}
