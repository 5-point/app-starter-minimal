import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureApiClient } from '@/lib/api-client';
import { AuthProvider, apiAuthHeaders } from '@/auth/auth';
import { env } from '@/lib/env';
import { getStoredServerUrl } from '@/lib/server-url';
import { routeTree } from './routeTree.gen';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Hash history keeps the app deployable from any static path (ERP same-origin
// hosting, zip drops, file:// previews) without server-side URL rewrites:
// the route lives in `#/home`, the server only ever serves `index.html`.
const router = createRouter({
  routeTree,
  context: { queryClient },
  history: createHashHistory(),
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function bootstrap() {
  // The server URL entered on the login page is persisted after a successful
  // login; until then the optional build-time default applies (may be empty).
  configureApiClient({
    baseUrl: getStoredServerUrl() ?? env.defaultApiBaseUrl,
    getAuthHeaders: apiAuthHeaders,
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

bootstrap();
