import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { LoginPage } from '@/features/auth/login-page';

const loginSearchSchema = z.object({
  /** Path to return to after a successful login (set by the auth guard). */
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: LoginPage,
});
