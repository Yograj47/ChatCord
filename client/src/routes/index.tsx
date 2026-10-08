import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { WelcomePage } from '../pages/auth/WelcomePage';
import { OAuthCallbackPage } from '../pages/auth/OAuthCallBackPage';
import { OnboardingLayout } from '../layouts/OnBoardingLayout';
import { AppLayout } from '../layouts/AppLayout';
import { ChatContainer } from '../components/chat/ChatContainer';

export const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* 1. PUBLIC / AUTHENTICATION LAYOUT */}
                <Route element={<AuthLayout />}>
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/auth/callback" element={<OAuthCallbackPage />} />
                </Route>

                {/* 2. FIRST-TIME USER ONBOARDING LAYOUT */}
                <Route element={<OnboardingLayout />}>
                    {/* <Route path="/onboarding/username" element={<UsernamePage />} /> */}
                </Route>

                {/* 3. AUTHENTICATED WORKSPACE LAYOUT */}
                <Route path="/app" element={<AppLayout />}>
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
        </BrowserRouter>
    );
};