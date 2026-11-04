import { createFileRoute, redirect } from '@tanstack/react-router';
import { isAuthenticated } from '@/auth/auth';
import { AppShell } from '@/components/app-shell';

/** Pathless layout route: guards every app page behind the session check. */
export const Route = createFileRoute('/_app')({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }
  },
  component: AppShell,
});
