import React from 'react';
import { LogoMark } from '../common/LogoMark';

interface HeaderBrandingProps {
  latencyMs?: number;
  isConnected?: boolean;
}

export const HeaderBranding: React.FC<HeaderBrandingProps> = ({
  latencyMs = 24,
  isConnected = true,
}) => {
  return (
    <div className="flex items-center space-x-3 shrink-0">
      <div className="flex items-center space-x-2">
        <LogoMark size={20} />
        <span className="font-mono text-xs font-bold tracking-wider text-zinc-100">
          CHATCORD
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* WS Latency Status Pill */}
      <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isConnected ? 'bg-emerald-400' : 'bg-rose-500'
          }`}
        />
        <span>{isConnected ? `WS Live · ${latencyMs}ms` : 'Disconnected'}</span>
      </div>
    </div>
  );
};