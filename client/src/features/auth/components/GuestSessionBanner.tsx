import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth/hooks/useSession';
import { AUTH_QUERY_KEY } from '@/features/auth/api/auth.keys';

export function GuestSessionBanner() {
  const { sessionData } = useSession();
  const [now, setNow] = useState(Date.now);
  const client = useQueryClient();
  const navigate = useNavigate();
  const expiresAt = sessionData?.expiresAt ? Date.parse(sessionData.expiresAt) : NaN;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!Number.isFinite(expiresAt) || now < expiresAt) return;
    void (async () => {
      const { socket } = await import('@/features/realtime/api/socket');
      socket.disconnect();
      await client.cancelQueries();
      client.clear();
      client.setQueryData(AUTH_QUERY_KEY, null);
      await navigate('/?guest=expired', { replace: true });
    })();
  }, [expiresAt, now, client, navigate]);
  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 60000));
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2 text-xs text-zinc-400">
      <p>
        Guest · {sessionData?.user?.username ?? 'Temporary account'} ·{' '}
        {Number.isFinite(remaining) ? `${remaining} min remaining` : '30-minute session'}
      </p>
      <a
        href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/google`}
        className="font-medium text-indigo-300 hover:text-indigo-200"
      >
        Sign in to continue
      </a>
    </div>
  );
}
