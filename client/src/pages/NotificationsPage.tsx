import { ArrowLeft, Mail, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FriendsPage } from '@/pages/FriendsPage';
import { InvitationsPage } from '@/pages/InvitationsPage';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const section = params.get('section') === 'invitations' ? 'invitations' : 'friends';
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-zinc-800/70 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              title="Go back"
              onClick={() => void navigate(-1)}
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-indigo-400"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <h1 className="text-sm font-semibold text-zinc-200">Notifications</h1>
          </div>
          <nav
            aria-label="Notification sections"
            className="flex gap-1 rounded-lg bg-zinc-900/70 p-1"
          >
            {(
              [
                { id: 'friends', label: 'Friends', icon: Users },
                { id: 'invitations', label: 'Invitations', icon: Mail },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                aria-pressed={section === id}
                onClick={() => setParams({ section: id })}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition ${section === id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-200'}`}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {section === 'friends' ? <FriendsPage initialView="requests" /> : <InvitationsPage />}
      </div>
    </div>
  );
}
