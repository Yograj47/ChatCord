import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ArrowRight } from 'lucide-react';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { useAuth } from '../../hooks/useAuth';

export const WelcomePage: React.FC = () => {
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const { loginAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSignIn = () => {
        // Redirects browser directly to NestJS Google OAuth strategy endpoint
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        window.location.href = `${backendUrl}/auth/google`;
    };

    const handleGuestSignIn = async () => {
        setIsGuestLoading(true);
        try {
            await loginAsGuest();
            navigate('/app');
        } catch (err) {
            console.error('Guest login failed:', err);
        } finally {
            setIsGuestLoading(false);
        }
    };

    return (
        <div className="flex flex-col text-left">
            {/* Title & Tagline */}
            <div className="space-y-1.5">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                    Sign in to ChatCord
                </h1>
                <p className="text-xs text-zinc-400 leading-relaxed">
                    Welcome back. Select your preferred authentication method to continue to your workspace.
                </p>
            </div>

            {/* Auth Actions */}
            <div className="w-full mt-6 space-y-3">
                <GoogleLoginButton
                    onClick={handleGoogleSignIn}
                />

                <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800/80" />
                    </div>
                    <div className="relative px-3 bg-[#111319] text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                        Or
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleGuestSignIn}
                    disabled={isGuestLoading}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 hover:bg-zinc-800/60 text-zinc-300 hover:text-zinc-100 text-xs font-medium rounded-xl border border-zinc-800 transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-zinc-700 disabled:opacity-50 group"
                >
                    <div className="flex items-center space-x-2.5">
                        <UserCheck className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                        <span>{isGuestLoading ? 'Creating guest session...' : 'Continue as Guest'}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                </button>
            </div>

            {/* Footer / TOS */}
            <p className="text-[11px] text-zinc-500 mt-6 leading-normal">
                By continuing, you agree to ChatCord’s{' '}
                <a href="#" className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors">
                    Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors">
                    Privacy Policy
                </a>.
            </p>
        </div>
    );
};