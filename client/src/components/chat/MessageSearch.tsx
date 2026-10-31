interface MessageSearchProps {
  value: string;
  onChange: (value: string) => void;
  searching: boolean;
}

export function MessageSearch({
  value,
  onChange,
  searching,
}: MessageSearchProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800">
      <input
        aria-label="Search messages in this conversation"
        type="search"
        maxLength={100}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search this conversation…"
        className="w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-xs text-zinc-200"
      />
      {searching && (
        <span role="status" className="text-xs text-zinc-400">
          Searching…
        </span>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-indigo-300"
        >
          Clear
        </button>
      )}
    </div>
  );
}
