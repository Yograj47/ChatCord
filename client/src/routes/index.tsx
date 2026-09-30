import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { WelcomePage } from '../pages/auth/WelcomePage';
import { OAuthCallbackPage } from '../pages/auth/OAuthCallBackPage';
import { OnboardingLayout } from '../layouts/OnBoardingLayout';
import { AppLayout } from '../layouts/AppLayout';

export const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* ========================================================= */}
                {/* 1. PUBLIC / AUTHENTICATION LAYOUT                          */}
                {/* ========================================================= */}
                <Route element={<AuthLayout />}>
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/auth/callback" element={<OAuthCallbackPage />} />
                </Route>

                {/* ========================================================= */}
                {/* 2. FIRST-TIME USER ONBOARDING LAYOUT                      */}
                {/* ========================================================= */}
                <Route element={<OnboardingLayout />}>
                    {/* <Route path="/onboarding/username" element={<UsernamePage />} /> */}
                </Route>

                {/* ========================================================= */}
                {/* 3. AUTHENTICATED WORKSPACE LAYOUT (3-Column Workspace)   */}
                {/* ========================================================= */}
                <Route path="/app" element={<AppLayout />}>
                    {/* Default view when no room is selected */}
                    {/* <Route index element={<EmptyWorkspaceView />} /> */}

                    {/* Active room view */}
                    {/* <Route path="rooms/:roomId" element={<RoomView />} />

                    {/* Contextual Thread route (keeps RoomView loaded in main panel) */}
                    {/* <Route path="rooms/:roomId/threads/:messageId" element={<RoomView />} />  */}
                </Route>

                {/* Catch-all fallback redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};