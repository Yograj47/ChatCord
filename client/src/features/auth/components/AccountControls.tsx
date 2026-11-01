import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, MoreHorizontal, Settings } from 'lucide-react';
import { Menu } from '@base-ui/react/menu';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getApiErrorMessage } from '@/shared/api/api-error';
import { useLayoutStore } from '@/shared/stores/layout.store';

export function AccountControls() {
  const { sessionData, logout, isLogoutPending } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setMobileView = useLayoutStore((state) => state.setMobileView);
  if (!sessionData) return null;
  const endSession = async () => {
    setError(null);
    try {
      await logout();
      await navigate('/', { replace: true });
    } catch (error) {
      setError(getApiErrorMessage(error, 'Could not log out. Please try again.'));
    }
  };
  const buttonClass =
    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none data-highlighted:bg-zinc-800/70 data-disabled:cursor-wait data-disabled:opacity-50';
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Account options"
        disabled={isLogoutPending}
        className="grid size-9 shrink-0 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-indigo-400"
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" align="end" sideOffset={10} className="z-50">
          <Menu.Popup className="w-56 rounded-2xl border border-zinc-700/60 bg-[#14161c] p-2 text-zinc-200 shadow-2xl outline-none">
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Your account
            </p>
            <Menu.Item
              className={buttonClass}
              disabled={isLogoutPending}
              onClick={() => {
                setMobileView('chat');
                void navigate('/app/settings', { state: { from: location.pathname } });
              }}
            >
              <Settings className="size-4 text-zinc-400" aria-hidden="true" />
              Settings
            </Menu.Item>
            <Menu.Separator className="my-1 h-px bg-zinc-800" />
            <Menu.Item
              className={`${buttonClass} text-rose-300`}
              disabled={isLogoutPending}
              closeOnClick={false}
              onClick={() => void endSession()}
            >
              <LogOut className="size-4" aria-hidden="true" />
              {isLogoutPending ? 'Logging out…' : 'Log out'}
            </Menu.Item>
            {error && (
              <p role="alert" className="px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
