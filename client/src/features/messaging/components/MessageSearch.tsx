import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MessageSearchProps {
  value: string;
  onChange: (value: string) => void;
  searching: boolean;
}

export function MessageSearch({ value, onChange, searching }: MessageSearchProps) {
  const [expanded, setExpanded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (expanded) input.current?.focus();
  }, [expanded]);
  const close = () => {
    onChange('');
    setExpanded(false);
    trigger.current?.focus();
  };
  return (
    <div
      className={`relative h-8 shrink-0 transition-[width] duration-300 ease-in-out motion-reduce:transition-none ${expanded ? 'w-36 sm:w-52' : 'w-8'}`}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="Search conversation"
        aria-expanded={expanded}
        aria-hidden={expanded}
        tabIndex={expanded ? -1 : 0}
        onClick={() => (expanded ? close() : setExpanded(true))}
        className={`absolute right-0 top-0 grid size-8 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-[opacity,transform] duration-200 motion-reduce:transition-none hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-indigo-400 ${expanded ? 'pointer-events-none scale-90 opacity-0' : 'scale-100 opacity-100 delay-150'}`}
      >
        <Search className="size-4" aria-hidden="true" />
      </button>
      <div
        inert={!expanded}
        aria-hidden={!expanded}
        className={`absolute inset-0 flex items-center transition-[opacity,transform] duration-200 motion-reduce:transition-none ${expanded ? 'translate-x-0 opacity-100 delay-100' : 'pointer-events-none translate-x-2 opacity-0'}`}
      >
        <input
          ref={input}
          aria-label="Search messages in this conversation"
          type="search"
          maxLength={100}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          }}
          placeholder="Search messages…"
          className="h-8 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 pl-3 pr-8 text-xs text-zinc-200 focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={close}
          aria-label="Close conversation search"
          className="absolute right-2 text-zinc-500 hover:text-zinc-200"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
        {searching && (
          <span role="status" className="sr-only">
            Searching…
          </span>
        )}
      </div>
    </div>
  );
}
