import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface AuthErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const AuthError: React.FC<AuthErrorProps> = ({
  message = 'An unexpected authentication error occurred.',
  onRetry,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="h-12 w-12 rounded-full bg-rose-950/50 border border-rose-800/60 flex items-center justify-center mb-4 text-rose-400">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <h2 className="text-lg font-semibold text-zinc-100">Sign in failed</h2>
      <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
        {message}
      </p>

      {/* Recovery Actions */}
      <div className="w-full mt-6 space-y-2.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-md"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl transition-colors border border-zinc-700/50"
        >
          <ArrowLeft className="h-4 w-4 text-zinc-400" />
          <span>Return to Welcome</span>
        </button>
      </div>
    </div>
  );
};