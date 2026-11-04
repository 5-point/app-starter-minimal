import { createFileRoute, redirect } from '@tanstack/react-router';
import { isAuthenticated } from '@/auth/auth';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: isAuthenticated() ? '/home' : '/login' });
  },
});
