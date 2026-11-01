import { useState } from 'react';
import { Camera, UserRound } from 'lucide-react';
import { useSession } from '@/features/auth/hooks/useSession';
import { ProfileForm } from '@/features/auth/components/ProfileForm';
import type { User } from '@/features/auth/types/auth.types';

function ProfilePhoto({ user }: { user: User }) {
  const [failed, setFailed] = useState(false);
  const initials = user.displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-800/70 bg-card p-5 sm:p-6">
      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-indigo-400/20 bg-indigo-400/10 text-base font-medium text-indigo-200">
        {user.avatar?.url && !failed ? (
          <img
            src={user.avatar.url}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          initials || <UserRound className="size-7" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Profile photo</p>
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-500 disabled:cursor-not-allowed"
          >
            <Camera className="size-3.5" aria-hidden="true" />
            Change photo
          </button>
          <span className="rounded-full border border-indigo-400/15 bg-indigo-400/5 px-2.5 py-1 text-[10px] font-medium text-indigo-300">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { sessionData } = useSession();
  const user = sessionData?.type === 'registered' ? sessionData.user : undefined;
  return (
    <section aria-labelledby="profile-heading" className="max-w-2xl">
      <h2 id="profile-heading" className="text-base font-semibold tracking-tight">
        Profile
      </h2>
      <p className="mb-6 mt-2 text-xs leading-relaxed text-zinc-500">
        Manage the details others see in ChatCord.
      </p>
      {!user ? (
        <div className="rounded-lg border border-zinc-800/70 bg-card p-6 text-sm leading-relaxed text-zinc-400">
          You’re browsing as a guest. Sign in with Google to create and edit your profile.
        </div>
      ) : (
        <div className="space-y-6">
          <ProfilePhoto key={user.avatar?.url ?? user.id} user={user} />
          <div className="rounded-lg border border-zinc-800/70 bg-card p-5 sm:p-6">
            <h3 className="mb-1 text-sm font-semibold">Personal details</h3>
            <p className="mb-6 text-xs leading-relaxed text-zinc-500">
              Your display name can change. Your username is how people find you.
            </p>
            <ProfileForm key={sessionData?.id} user={user} />
          </div>
        </div>
      )}
    </section>
  );
}
