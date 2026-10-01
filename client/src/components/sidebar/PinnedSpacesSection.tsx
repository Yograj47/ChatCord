import React from 'react';

export const PinnedSpacesSection: React.FC = () => {
    return (
        <div className="opacity-60">
            <div className="px-2 mb-1.5 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <div className="flex items-center space-x-1.5">
                    <span>Pinned Spaces</span>
                    <span className="text-[9px] font-normal font-mono text-amber-500/90 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded">
                        Coming Soon
                    </span>
                </div>
            </div>
            <div className="space-y-0.5">
                <div className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-zinc-500 text-xs cursor-not-allowed">
                    <span className="text-amber-500/50">★</span>
                    <span className="truncate">Announcements</span>
                </div>
                <div className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-zinc-500 text-xs cursor-not-allowed">
                    <span className="text-amber-500/50">★</span>
                    <span className="truncate">Dev-General</span>
                </div>
            </div>
        </div>
    );
};