import React from 'react';

export const AppLayoutSkeleton: React.FC = () => {
    return (
        <div className="h-dvh w-vw max-h-dvh max-w-vw bg-[#0a0b0e] text-zinc-100 flex overflow-hidden font-sans antialiased animate-pulse">
            {/* 1. Sidebar Skeleton */}
            <div className="hidden min-[900px]:flex h-full w-60 shrink-0 bg-[#0d0e13] border-r border-zinc-800/60 flex-col justify-between p-4">
                <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded bg-zinc-800" />
                        <div className="h-4 w-28 bg-zinc-800 rounded" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-3 w-16 bg-zinc-800/60 rounded" />
                        <div className="h-7 w-full bg-zinc-800/40 rounded-lg" />
                        <div className="h-7 w-5/6 bg-zinc-800/40 rounded-lg" />
                    </div>
                </div>
                <div className="flex items-center space-x-3 pt-4 border-t border-zinc-800/60">
                    <div className="h-8 w-8 rounded-full bg-zinc-800" />
                    <div className="space-y-1 flex-1">
                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                        <div className="h-2 w-12 bg-zinc-800/60 rounded" />
                    </div>
                </div>
            </div>

            {/* 2. Main Right Column Skeleton */}
            <div className="flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden">
                {/* Header Skeleton */}
                <div className="h-14 border-b border-zinc-800/60 flex items-center px-6 justify-between shrink-0">
                    <div className="h-4 w-32 bg-zinc-800 rounded" />
                    <div className="flex space-x-3">
                        <div className="h-7 w-7 rounded bg-zinc-800" />
                        <div className="h-7 w-7 rounded bg-zinc-800" />
                    </div>
                </div>

                {/* Workspace Content Skeleton */}
                <div className="flex-1 flex min-h-0 h-full overflow-hidden relative">
                    <main className="flex-1 flex flex-col bg-[#0a0b0e] p-6 justify-end space-y-4">
                        <div className="flex items-start space-x-3">
                            <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-24 bg-zinc-800 rounded" />
                                <div className="h-3 w-3/4 bg-zinc-800/60 rounded" />
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-20 bg-zinc-800 rounded" />
                                <div className="h-3 w-1/2 bg-zinc-800/60 rounded" />
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};