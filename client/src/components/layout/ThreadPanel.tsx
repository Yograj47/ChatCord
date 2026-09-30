import React from 'react';
import { MessageSquare, X } from 'lucide-react';

export const ThreadPanel: React.FC = () => {
    return (
        <aside className="hidden xl:flex w-[320px] bg-[#0d0f14] border-l border-zinc-800/80 flex-col shrink-0">
            <div className="h-11 px-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-200">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Thread · 5 replies</span>
                </div>
                <button type="button" className="text-zinc-500 hover:text-zinc-300">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
                {/* Thread Original Message Context */}
                <div className="p-3 bg-[#13161d] rounded-lg border border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-200">Julian Reyes</span>
                        <span className="text-[10px] text-zinc-500 font-mono">09:14 AM</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                        Pushed the new auth refactor to <span className="text-indigo-400 font-mono">feat/oauth2-flow</span>. Can someone review before standup?
                    </p>
                </div>

                {/* Thread Replies */}
                <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-200">Mara Voss</span>
                            <span className="text-[10px] text-zinc-500 font-mono">09:21 AM</span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                            Cache the decoded payload for the request lifecycle. Leaving a comment on the PR.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-200">Diego Santos</span>
                            <span className="text-[10px] text-zinc-500 font-mono">09:27 AM</span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                            Merged! CI passed green everywhere. Great cleanup.
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};