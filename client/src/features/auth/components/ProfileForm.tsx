import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileFormData } from '@/features/auth/schemas/profile.schema';
import { useUpdateProfile } from '@/features/auth/hooks/useUpdateProfile';
import type { User } from '@/features/auth/types/auth.types';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { actionClassName } from '@/shared/ui/action-styles';
import { showSuccess } from '@/shared/lib/toast';

export function ProfileForm({ user }: { user: User }) {
  const id = useId();
  const [saved, setSaved] = useState(false);
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user.username ?? '', displayName: user.displayName },
  });
  const save = async (profile: ProfileFormData) => {
    try {
      await update.mutateAsync(profile);
      showSuccess('Profile updated.');
      reset(profile);
      setSaved(true);
    } catch {
      // Preserve the draft and show the API failure below for correction/retry.
    }
  };
  const inputClass =
    'mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-indigo-400 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-400';
  return (
    <form onSubmit={handleSubmit(save)} className="space-y-5" aria-busy={update.isPending}>
      <div>
        <label htmlFor={`${id}-name`} className="text-xs font-medium text-zinc-300">
          Display name
        </label>
        <input
          id={`${id}-name`}
          {...register('displayName')}
          autoComplete="nickname"
          maxLength={50}
          disabled={update.isPending}
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? `${id}-name-error` : undefined}
          className={inputClass}
        />
        {errors.displayName && (
          <p id={`${id}-name-error`} role="alert" className="mt-2 text-xs text-rose-300">
            {errors.displayName.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-username`} className="text-xs font-medium text-zinc-300">
          Username
        </label>
        <input
          id={`${id}-username`}
          {...register('username')}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          disabled={update.isPending}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={`${id}-username-hint${errors.username ? ` ${id}-username-error` : ''}`}
          className={inputClass}
        />
        <p id={`${id}-username-hint`} className="mt-2 text-xs text-zinc-400">
          3–20 letters, numbers, or underscores. Your username must be unique.
        </p>
        {errors.username && (
          <p id={`${id}-username-error`} role="alert" className="mt-2 text-xs text-rose-300">
            {errors.username.message}
          </p>
        )}
      </div>
      {user.email && <p className="break-all text-xs text-zinc-400">Signed in as {user.email}</p>}
      {saved && !isDirty && (
        <p role="status" className="text-sm text-emerald-300">
          Your profile is up to date.
        </p>
      )}
      {update.isError && (
        <p role="alert" className="text-sm text-rose-300">
          {getApiErrorMessage(update.error, 'Could not save your profile. Please try again.')}
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-border pt-5">
        <button
          type="button"
          disabled={update.isPending || !isDirty}
          onClick={() => {
            reset({ username: user.username ?? '', displayName: user.displayName });
            setSaved(false);
          }}
          className={actionClassName}
        >
          Reset changes
        </button>
        <button
          type="submit"
          disabled={update.isPending || !isDirty}
          className={`${actionClassName} border-indigo-500/40 bg-indigo-500/10 text-indigo-200`}
        >
          {update.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
