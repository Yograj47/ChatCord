import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ArrowRight } from 'lucide-react';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';
import { useAuth } from '../../hooks/useAuth';
import { showSuccess, showError } from '../../lib/toast'; // <-- Import ChatCord toast helpers

export const WelcomePage: React.FC = () => {
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const { loginAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSignIn = () => {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        window.location.href = `${backendUrl}/auth/google`;
    };

    const handleGuestSignIn = async () => {
        setIsGuestLoading(true);
        try {
            await loginAsGuest();
            showSuccess('Guest session initialized successfully!'); // <-- Success toast
            navigate('/app');
        } catch (err) {
            console.error('Guest login failed:', err);
            showError('Failed to create guest session. Please try again.'); // <-- Error toast
        } finally {
            setIsGuestLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                    Welcome to ChatCord
                </h1>
                <p className="text-xs text-zinc-400">
                    Connect, collaborate, and chat in real-time. Choose an option below to get started.
                </p>
            </div>

            <div className="space-y-4 pt-2">
                {/* Google Sign In Option */}
                <GoogleLoginButton onClick={handleGoogleSignIn} />

                <div className="relative flex py-2 items-center">
                    <div className="grow border-t border-zinc-800"></div>
                    <span className="shrink mx-4 text-zinc-500 text-[10px] uppercase font-mono tracking-wider">or</span>
                    <div className="grow border-t border-zinc-800"></div>
                </div>

                {/* Guest Sign In Button */}
                <button
                    onClick={handleGuestSignIn}
                    disabled={isGuestLoading}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-200 text-xs font-medium transition-all duration-200 disabled:opacity-50"
                >
                    <UserCheck className="h-4 w-4 text-indigo-400" />
                    <span>{isGuestLoading ? 'Initializing Guest...' : 'Continue as Guest'}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
                </button>
            </div>
        </div>
    );
};