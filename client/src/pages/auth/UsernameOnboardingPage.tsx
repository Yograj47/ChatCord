import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, AtSign, User as UserIcon } from 'lucide-react';
import { onboardingSchema, type OnboardingFormData } from '../../types/auth';
import { useAuth } from '#hooks/useAuth';
import { showSuccess, showError } from '../../lib/toast'; // <-- Import toast helpers

export const UsernameOnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const { completeOnboarding, isCompleteOnboardingPending } = useAuth();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<OnboardingFormData>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            username: '',
            displayName: '',
        },
    });

    const onSubmit = async (data: OnboardingFormData) => {
        try {
            await completeOnboarding(data);
            showSuccess('Profile configured successfully! Welcome to ChatCord.'); // <-- Success toast
            navigate('/app', { replace: true });
        } catch (err: any) {
            const message = err?.response?.data?.message || 'Failed to set username. It may already be taken.';
            setError('username', { type: 'server', message });
            showError(message); // <-- Error toast notification
        }
    };

    return (
        <div className="w-full text-left">
            {/* Header */}
            <div className="space-y-1.5 mb-6">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                    Choose your username
                </h1>
                <p className="text-xs text-zinc-400 leading-relaxed">
                    This is how other ChatCord members will find and mention you in channels.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Username Input */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                        Username
                    </label>
                    <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-zinc-500">
                            <AtSign className="h-4 w-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="e.g. dev_alex"
                            {...register('username')}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 text-xs rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    {errors.username && (
                        <p className="text-[11px] text-red-400 mt-1">{errors.username.message}</p>
                    )}
                </div>

                {/* Display Name Input */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-300 uppercase tracking-wider">
                        Display Name <span className="text-zinc-600 lowercase">(optional)</span>
                    </label>
                    <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-zinc-500">
                            <UserIcon className="h-4 w-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="e.g. Alex Johnson"
                            {...register('displayName')}
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 text-zinc-100 placeholder-zinc-600 text-xs rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    {errors.displayName && (
                        <p className="text-[11px] text-red-400 mt-1">{errors.displayName.message}</p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isCompleteOnboardingPending}
                    className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 focus:ring-offset-[#0f1117] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {isCompleteOnboardingPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving username...</span>
                        </>
                    ) : (
                        <>
                            <span>Continue to ChatCord</span>
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};