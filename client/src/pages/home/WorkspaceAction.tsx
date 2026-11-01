import { ArrowUpRight, type LucideIcon } from 'lucide-react';

export function WorkspaceAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 items-start gap-3 rounded-xl border border-zinc-800/70 p-4 text-left transition hover:border-zinc-700 hover:bg-zinc-900/50 focus-visible:outline-2 focus-visible:outline-indigo-400"
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-indigo-300/80" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-zinc-200">{title}</span>
        <span className="mt-1.5 block text-xs leading-relaxed text-zinc-400">{description}</span>
      </span>
      <ArrowUpRight
        className="size-3.5 shrink-0 text-zinc-600 group-hover:text-zinc-300"
        aria-hidden="true"
      />
    </button>
  );
}
