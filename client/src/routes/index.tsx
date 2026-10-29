import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { WelcomePage } from '../pages/auth/WelcomePage';
import { OAuthCallbackPage } from '../pages/auth/OAuthCallBackPage';
import { OnboardingLayout } from '../layouts/OnBoardingLayout';
import { UsernameOnboardingPage } from '../pages/auth/UsernameOnboardingPage';
import { AppLayout } from '../layouts/AppLayout';
import { ChatContainer } from '../components/chat/ChatContainer';
import { useAuth } from '../hooks/useAuth';

// Import the layout-specific skeletons we created
import { AuthLayoutSkeleton } from '../components/common/AuthLayoutSkeleton';
import { OnboardingLayoutSkeleton } from '../components/common/OnboardingLayoutSkeleton';
import { AppLayoutSkeleton } from '../components/common/AppLayoutSkeleton';
import { AppHomeDashboard } from '#components/chat/AppHomeDashboard';

export const AppRouter: React.FC = () => {
    const { sessionData, isLoading, requiresOnboarding, isGuest } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Return skeleton that matches whichever section the user is trying to access
        if (location.pathname.startsWith('/app')) {
            return <AppLayoutSkeleton />;
        }
        if (location.pathname.startsWith('/onboarding')) {
            return <OnboardingLayoutSkeleton />;
        }
        return <AuthLayoutSkeleton />;
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
                {/* Default redirect to dev-general if no */}
                <Route index element={<AppHomeDashboard />} />

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