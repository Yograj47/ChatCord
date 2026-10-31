import type { PresenceStatus } from "../../types/realtime";

export function PresenceBadge({ status }: { status: PresenceStatus }) {
  const label =
    status === "online"
      ? "Online"
      : status === "offline"
        ? "Offline"
        : "Status unavailable";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400"
      aria-label={label}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${status === "online" ? "bg-emerald-400" : status === "offline" ? "bg-zinc-600" : "bg-zinc-700 ring-1 ring-zinc-500"}`}
      />
      {label}
    </span>
  );
}
