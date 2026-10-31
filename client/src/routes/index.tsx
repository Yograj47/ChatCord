import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { WelcomePage } from '../pages/auth/WelcomePage';
import { OAuthCallbackPage } from '../pages/auth/OAuthCallbackPage';
import { OnboardingLayout } from '../layouts/OnboardingLayout';
import { UsernameOnboardingPage } from '../pages/auth/UsernameOnboardingPage';
import { AppLayout } from '../layouts/AppLayout';
import { ChatContainer } from '../components/chat/ChatContainer';
import { useAuth } from '../hooks/useAuth';
import { FriendsPage } from '../pages/app/FriendsPage';
import { InvitationsPage } from '../pages/app/InvitationsPage';


import { AuthLayoutSkeleton } from '../components/common/AuthLayoutSkeleton';
import { OnboardingLayoutSkeleton } from '../components/common/OnboardingLayoutSkeleton';
import { AppLayoutSkeleton } from '../components/common/AppLayoutSkeleton';
import { AppHomeDashboard } from '#components/chat/AppHomeDashboard';

export const AppRouter: React.FC = () => {
    const { sessionData, isLoading, requiresOnboarding, isGuest } = useAuth();
    const location = useLocation();

    if (isLoading) {

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

                <Route index element={<AppHomeDashboard />} />
                <Route path="friends" element={<FriendsPage />} />
                <Route path="invitations" element={<InvitationsPage />} />


                <Route path="rooms/:roomId" element={<ChatContainer />} />


                <Route path="rooms/:roomId/threads/:messageId" element={<ChatContainer />} />


                <Route path="dms/:dmId" element={<ChatContainer />} />
            </Route>


            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
