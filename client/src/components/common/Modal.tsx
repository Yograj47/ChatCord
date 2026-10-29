import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    maxWidth?: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    icon,
    maxWidth = 'max-w-lg',
    children,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            {/* Immersive Card Frame */}
            <div className={`relative w-full ${maxWidth} bg-[#111319] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden`}>
                {/* Background Glow Accent */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80">
                    <div className="flex items-center space-x-3">
                        {icon && (
                            <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h2 className="text-base font-semibold text-zinc-100 font-mono tracking-wider">
                                {title}
                            </h2>
                            {description && (
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800/50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body / Children */}
                {children}
            </div>
        </div>
    );
};