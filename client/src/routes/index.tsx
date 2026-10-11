import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { WelcomePage } from '../pages/auth/WelcomePage';
import { OAuthCallbackPage } from '../pages/auth/OAuthCallBackPage';
import { OnboardingLayout } from '../layouts/OnBoardingLayout';
import { UsernameOnboardingPage } from '../pages/auth/UsernameOnboardingPage';
import { AppLayout } from '../layouts/AppLayout';
import { ChatContainer } from '../components/chat/ChatContainer';
import { useAuth } from '../hooks/useAuth';

export const AppRouter: React.FC = () => {
    const { sessionData, isLoading, requiresOnboarding, isGuest } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0f1117]">
                <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    <p className="text-xs text-zinc-400">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    const isAuthenticated = Boolean(sessionData);

    return (
        <Routes>
            {/* 1. PUBLIC / AUTHENTICATION */}
            <Route element={<AuthLayout />}>
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            requiresOnboarding && !isGuest ? (
                                <Navigate to="/onboarding/username" replace />
                            ) : (
                                <Navigate to="/app" replace />
                            )
                        ) : (
                            <WelcomePage />
                        )
                    }
                />
                <Route path="/auth/callback" element={<OAuthCallbackPage />} />
            </Route>

            {/* 2. FIRST-TIME USER ONBOARDING (Bypassed for guests) */}
            <Route element={<OnboardingLayout />}>
                <Route
                    path="/onboarding/username"
                    element={
                        !isAuthenticated ? (
                            <Navigate to="/" replace />
                        ) : isGuest || !requiresOnboarding ? (
                            <Navigate to="/app" replace />
                        ) : (
                            <UsernameOnboardingPage />
                        )
                    }
                />
            </Route>

            {/* 3. AUTHENTICATED WORKSPACE (Registered & Guest Users) */}
            <Route
                path="/app"
                element={
                    !isAuthenticated ? (
                        <Navigate to="/" replace />
                    ) : requiresOnboarding && !isGuest ? (
                        <Navigate to="/onboarding/username" replace />
                    ) : (
                        <AppLayout />
                    )
                }
            >
                {/* Default redirect to dev-general if no room specified */}
                <Route index element={<Navigate to="/app/rooms/dev-general" replace />} />

                {/* Active channel / room view */}
                <Route path="rooms/:roomId" element={<ChatContainer />} />

                {/* Active room with thread side panel opened */}
                <Route path="rooms/:roomId/threads/:messageId" element={<ChatContainer />} />

                {/* Active Direct Message route */}
                <Route path="dms/:dmId" element={<ChatContainer />} />
            </Route>

            {/* Catch-all fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};