import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/auth/auth';
import { Button } from '@/components/ui/button';
import { getStoredServerUrl } from '@/lib/server-url';

export function AppShell() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = session?.userName ?? session?.userEmail ?? (session ? `Device ${session.deviceId}` : '');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-[var(--card)]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/home" className="mr-2 text-sm font-semibold tracking-tight">
            ERP Minimal App
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
            <Link
              to="/home"
              className="rounded-md px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              activeProps={{ className: 'bg-[var(--accent)] font-medium text-[var(--accent-foreground)]' }}
            >
              Home
            </Link>
          </nav>
          {session && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-[var(--muted-foreground)] sm:inline">{displayName}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Log out"
                onClick={() => {
                  signOut();
                  void navigate({ to: '/login' });
                }}
              >
                <LogOut /> Log out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      {getStoredServerUrl() && (
        <footer className="border-t py-4">
          <p className="mx-auto w-full max-w-6xl px-4 text-xs text-[var(--muted-foreground)]">{getStoredServerUrl()}</p>
        </footer>
      )}
    </div>
  );
}
