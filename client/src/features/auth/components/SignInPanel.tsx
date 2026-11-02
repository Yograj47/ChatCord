import { GoogleLoginButton } from '@/features/auth/components/GoogleLoginButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { showError, showSuccess } from '@/shared/lib/toast';
import { ArrowRight, UserCheck } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export const SignInPanel: React.FC = () => {
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleGoogleSignIn = () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleGuestSignIn = async () => {
    setIsGuestLoading(true);
    try {
      await loginAsGuest();
      showSuccess('Guest session initialized successfully!');
      void navigate('/app');
    } catch {
      showError('Failed to create guest session. Please try again.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <section
      id="get-started"
      aria-labelledby="sign-in-heading"
      className="scroll-mt-24 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8"
    >
      {params.get('guest') === 'expired' && (
        <p
          role="status"
          className="mb-5 rounded-lg border border-amber-400/15 bg-amber-400/5 p-3 text-xs leading-relaxed text-amber-200/80"
        >
          Your 30-minute guest session ended. Sign in to continue with an account.
        </p>
      )}
      <div className="space-y-2">
        <h2 id="sign-in-heading" className="text-xl font-semibold tracking-tight text-zinc-100">
          Join the conversation
        </h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Sign in to make it your space, or take a look around as a guest.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <GoogleLoginButton onClick={handleGoogleSignIn} className="min-h-11" />
        <p className="text-center text-[11px] leading-relaxed text-zinc-500">
          Your own username, friendships, private chats, and room creation.
        </p>

        {params.get('guest') !== 'expired' && (
          <>
            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-zinc-800"></div>
              <span className="shrink mx-4 text-zinc-500 text-[10px] uppercase font-mono tracking-wider">
                or
              </span>
              <div className="grow border-t border-zinc-800"></div>
            </div>

            <button
              onClick={handleGuestSignIn}
              disabled={isGuestLoading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-200 text-xs font-medium transition-all duration-200 disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4 text-indigo-400" />
              <span>{isGuestLoading ? 'Initializing Guest...' : 'Continue as Guest'}</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
            </button>
            <p className="text-center text-[11px] leading-relaxed text-zinc-500">
              Random username · Public rooms · 30-minute session
            </p>
          </>
        )}
      </div>
      <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-500">
        Before continuing, read our{' '}
        <Link to="/terms" className="text-zinc-300 hover:underline">
          Terms of use
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-zinc-300 hover:underline">
          Privacy policy
        </Link>
        .
      </p>
    </section>
  );
};
