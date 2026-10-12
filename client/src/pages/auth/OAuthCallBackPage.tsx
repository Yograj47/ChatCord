import React from 'react';
import { Loader2 } from 'lucide-react';

export const OAuthCallbackPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="h-12 w-12 rounded-full bg-indigo-950/65 border border-indigo-800/50 flex items-center justify-center mb-4 text-indigo-400">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>

            <h2 className="text-lg font-semibold text-zinc-100">
                Completing sign in...
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
                Setting up your workspace, please wait.
            </p>
        </div>
    );
};