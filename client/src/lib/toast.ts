import { toast as sonner, type ExternalToast } from 'sonner';
import React from 'react';
import {
    CheckCircle2,
    AlertCircle,
    Info,
    AlertTriangle,
    Loader2,
} from 'lucide-react';


const baseStyle: React.CSSProperties = {
    background: '#111319',
    border: '1px solid rgba(39, 39, 42, 0.8)',
    color: '#f4f4f5',
    borderRadius: '0.875rem',
    fontFamily: 'sans-serif',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
};

export const toast = {
    success: (message: string, options?: ExternalToast) =>
        sonner.success(message, {
            ...options,
            style: { ...baseStyle, borderColor: 'rgba(16, 185, 129, 0.3)' },
            icon: React.createElement(CheckCircle2, { className: 'h-4 w-4 text-emerald-400 shrink-0' }),
        }),

    error: (message: string, options?: ExternalToast) =>
        sonner.error(message, {
            ...options,
            style: { ...baseStyle, borderColor: 'rgba(239, 68, 68, 0.3)' },
            icon: React.createElement(AlertCircle, { className: 'h-4 w-4 text-rose-400 shrink-0' }),
        }),

    info: (message: string, options?: ExternalToast) =>
        sonner.info(message, {
            ...options,
            style: { ...baseStyle, borderColor: 'rgba(99, 102, 241, 0.3)' },
            icon: React.createElement(Info, { className: 'h-4 w-4 text-indigo-400 shrink-0' }),
        }),

    warning: (message: string, options?: ExternalToast) =>
        sonner.warning(message, {
            ...options,
            style: { ...baseStyle, borderColor: 'rgba(245, 158, 11, 0.3)' },
            icon: React.createElement(AlertTriangle, { className: 'h-4 w-4 text-amber-400 shrink-0' }),
        }),

    loading: (message: string, options?: ExternalToast) =>
        sonner.loading(message, {
            ...options,
            style: { ...baseStyle, borderColor: 'rgba(99, 102, 241, 0.3)' },
            icon: React.createElement(Loader2, { className: 'h-4 w-4 text-indigo-400 animate-spin shrink-0' }),
        }),

    dismiss: (id?: string | number) => sonner.dismiss(id),

    promise: sonner.promise,
};


export const showSuccess = (message: string, options?: ExternalToast) => toast.success(message, options);
export const showError = (message: string, options?: ExternalToast) => toast.error(message, options);
export const showInfo = (message: string, options?: ExternalToast) => toast.info(message, options);
export const showWarning = (message: string, options?: ExternalToast) => toast.warning(message, options);