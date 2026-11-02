import { LegacySocialRedirect } from '@/app/components/LegacySocialRedirect';
import { RouteBoundary } from '@/app/components/RouteBoundary';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { OnboardingLayout } from '@/app/layouts/OnboardingLayout';
import { useSession } from '@/features/auth/hooks/useSession';
import { AppSplash } from '@/shared/ui/AppSplash';
import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const LegalPage = lazy(() =>
  import('@/pages/legal/LegalPage').then((module) => ({ default: module.LegalPage })),
);

const WelcomePage = lazy(() =>
  import('@/pages/auth/WelcomePage').then((module) => ({ default: module.WelcomePage })),
);
const OAuthCallbackPage = lazy(() =>
  import('@/pages/auth/OAuthCallbackPage').then((module) => ({
    default: module.OAuthCallbackPage,
  })),
);
const UsernameOnboardingPage = lazy(() =>
  import('@/pages/auth/UsernameOnboardingPage').then((module) => ({
    default: module.UsernameOnboardingPage,
  })),
);
const AppLayout = lazy(() =>
  import('@/app/layouts/AppLayout').then((module) => ({ default: module.AppLayout })),
);
const ChatContainer = lazy(() =>
  import('@/features/messaging/components/ChatContainer').then((module) => ({
    default: module.ChatContainer,
  })),
);
const NotificationsPage = lazy(() =>
  import('@/pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })),
);
const HomePage = lazy(() =>
  import('@/pages/HomePage').then((module) => ({ default: module.HomePage })),
);
const SettingsLayout = lazy(() =>
  import('@/app/layouts/SettingsLayout').then((module) => ({ default: module.SettingsLayout })),
);
const ProfilePage = lazy(() =>
  import('@/pages/settings/ProfilePage').then((module) => ({ default: module.ProfilePage })),
);
const PasswordPage = lazy(() =>
  import('@/pages/settings/PasswordPage').then((module) => ({ default: module.PasswordPage })),
);

export const AppRouter: React.FC = () => {
  const { sessionData, isLoading, requiresOnboarding, isGuest } = useSession();

  if (isLoading) {
    return <AppSplash />;
  }

  const isAuthenticated = Boolean(sessionData);

  return (
    <RouteBoundary>
      <Suspense fallback={<AppSplash />}>
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
            <Route path="/privacy" element={<LegalPage kind="privacy" />} />
            <Route path="/terms" element={<LegalPage kind="terms" />} />
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
            path="/app/settings"
            element={
              isGuest ? (
                <Navigate to="/app" replace />
              ) : !isAuthenticated ? (
                <Navigate to="/" replace />
              ) : requiresOnboarding && !isGuest ? (
                <Navigate to="/onboarding/username" replace />
              ) : (
                <SettingsLayout />
              )
            }
          >
            <Route index element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="password" element={<PasswordPage />} />
            <Route path="*" element={<Navigate to="/app/settings" replace />} />
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
            <Route index element={<HomePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="friends" element={<LegacySocialRedirect section="friends" />} />
            <Route path="invitations" element={<LegacySocialRedirect section="invitations" />} />

            <Route path="rooms/:roomId" element={<ChatContainer />} />

            <Route path="rooms/:roomId/threads/:messageId" element={<ChatContainer />} />

            <Route path="dms/:dmId" element={<ChatContainer />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteBoundary>
  );
};
