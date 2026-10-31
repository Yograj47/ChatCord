import { Hash } from 'lucide-react';
import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface RoomFieldsProps {
  nameField: UseFormRegisterReturn<'name'>;
  descriptionField: UseFormRegisterReturn<'description'>;
  nameError?: string;
  descriptionError?: string;
  disabled: boolean;
}
export function RoomFields({
  nameField,
  descriptionField,
  nameError,
  descriptionError,
  disabled,
}: RoomFieldsProps) {
  const id = useId();
  return (
    <>
      <div className="space-y-1.5">
        <label
          htmlFor={`${id}-name`}
          className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider"
        >
          Room Name
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-zinc-500">
            <Hash className="h-4 w-4" aria-hidden="true" />
          </span>
          <input
            {...nameField}
            id={`${id}-name`}
            autoFocus
            disabled={disabled}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? `${id}-name-error` : undefined}
            type="text"
            placeholder="e.g. core-architecture"
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 text-xs rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-mono"
          />
        </div>
        {nameError && (
          <p id={`${id}-name-error`} role="alert" className="text-[11px] text-red-400 mt-1">
            {nameError}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor={`${id}-description`}
          className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider"
        >
          Description <span className="text-zinc-600 lowercase">(optional)</span>
        </label>
        <textarea
          {...descriptionField}
          id={`${id}-description`}
          disabled={disabled}
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={descriptionError ? `${id}-description-error` : undefined}
          rows={3}
          placeholder="What is this room about?"
          className="w-full p-3 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 text-xs rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none"
        />
        {descriptionError && (
          <p id={`${id}-description-error`} role="alert" className="text-[11px] text-red-400 mt-1">
            {descriptionError}
          </p>
        )}
      </div>
    </>
  );
}
