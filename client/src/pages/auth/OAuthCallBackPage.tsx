import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthError } from '#components/auth/AuthError';

type OAuthStatus = 'loading' | 'success' | 'authentication_error';

export const OAuthCallbackPage: React.FC = () => {
    const [status, setStatus] = useState<OAuthStatus>('loading');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setStatus('authentication_error');
            return;
        }

        // Process Google OAuth payload
        const timer = setTimeout(() => {
            if (code) {
                setStatus('success');
                // Route first-time Google users to onboarding username setup
                setTimeout(() => {
                    navigate('/onboarding/username');
                }, 600);
            } else {
                setStatus('authentication_error');
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [searchParams, navigate]);

    if (status === 'authentication_error') {
        return (
            <AuthError
                message="We couldn't verify your Google authentication request."
                onRetry={() => setStatus('loading')}
            />
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center mb-4 text-indigo-400">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>

            <h2 className="text-lg font-semibold text-zinc-100">
                {status === 'loading' ? 'Authenticating with Google...' : 'Authentication complete!'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
                {status === 'loading'
                    ? 'Connecting your account, please wait.'
                    : 'Redirecting to ChatCord setup...'}
            </p>
        </div>
    );
};