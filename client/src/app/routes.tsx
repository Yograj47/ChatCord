import { RouteBoundary } from '@/app/components/RouteBoundary';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { OnboardingLayout } from '@/app/layouts/OnboardingLayout';
import { useSession } from '@/features/auth/hooks/useSession';
import { AppLayoutSkeleton } from '@/shared/ui/AppLayoutSkeleton';
import { AuthLayoutSkeleton } from '@/shared/ui/AuthLayoutSkeleton';
import { OnboardingLayoutSkeleton } from '@/shared/ui/OnboardingLayoutSkeleton';
import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

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
const FriendsPage = lazy(() =>
  import('@/pages/FriendsPage').then((module) => ({ default: module.FriendsPage })),
);
const InvitationsPage = lazy(() =>
  import('@/pages/InvitationsPage').then((module) => ({ default: module.InvitationsPage })),
);
const HomePage = lazy(() =>
  import('@/pages/HomePage').then((module) => ({ default: module.HomePage })),
);

export const AppRouter: React.FC = () => {
  const { sessionData, isLoading, requiresOnboarding, isGuest } = useSession();
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
    <RouteBoundary>
      <Suspense
        fallback={
          <div role="status" className="p-8">
            Loading screen…
          </div>
        }
      >
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
            <Route index element={<HomePage />} />
            <Route path="friends" element={<FriendsPage />} />
            <Route path="invitations" element={<InvitationsPage />} />

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
