import { useState, type FormEvent } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { KeyRound, Server, UserRound } from 'lucide-react';
import { AuthError, useAuth } from '@/auth/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { applyServerUrl, getStoredServerUrl, storeServerUrl } from '@/lib/server-url';
import { cn } from '@/lib/utils';
import { env } from '@/lib/env';

type LoginMode = 'credentials' | 'device';

const MODES: Array<{ id: LoginMode; label: string; icon: typeof UserRound }> = [
  { id: 'credentials', label: 'ERP login', icon: UserRound },
  { id: 'device', label: 'Device access', icon: KeyRound },
];

export function LoginPage() {
  const { signInWithCredentials, signInWithDevice } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };
  const [mode, setMode] = useState<LoginMode>('credentials');
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(undefined);
    setPending(true);
    try {
      // Point the API client at the entered server before any auth request.
      const serverUrl = applyServerUrl(String(data.get('serverUrl') ?? ''));
      if (mode === 'credentials') {
        await signInWithCredentials(String(data.get('email') ?? ''), String(data.get('password') ?? ''));
      } else {
        await signInWithDevice(String(data.get('deviceId') ?? ''), String(data.get('deviceToken') ?? ''));
      }
      storeServerUrl(serverUrl);
      void navigate({ to: search.redirect ?? '/home' });
    } catch (cause) {
      setError(cause instanceof AuthError ? cause.message : 'Login failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--muted)] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ERP Minimal App</CardTitle>
          <CardDescription>Sign in to your ERP server.</CardDescription>
        </CardHeader>
        <div className="flex gap-1 px-6">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setError(undefined);
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
                mode === id
                  ? 'border-[var(--border)] bg-[var(--accent)] font-medium text-[var(--accent-foreground)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:bg-[var(--accent)]',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="serverUrl" className="flex items-center gap-1.5 text-sm font-medium">
                <Server className="h-4 w-4" /> Server URL
              </label>
              <Input
                id="serverUrl"
                name="serverUrl"
                inputMode="url"
                autoComplete="url"
                placeholder="https://teamspace.example.com"
                defaultValue={getStoredServerUrl() ?? env.defaultApiBaseUrl}
                required
              />
              <p className="text-xs text-[var(--muted-foreground)]">Base URL of your ERP instance, e.g. https://teamspace.example.com.</p>
            </div>
            {mode === 'credentials' ? (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input id="email" name="email" type="email" placeholder="name@company.com" autoComplete="username" required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="deviceId" className="text-sm font-medium">
                    Device id
                  </label>
                  <Input id="deviceId" name="deviceId" inputMode="numeric" placeholder="e.g. 101" autoComplete="username" required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="deviceToken" className="text-sm font-medium">
                    Device password
                  </label>
                  <Input id="deviceToken" name="deviceToken" type="password" placeholder="••••••••" autoComplete="current-password" required />
                  <p className="text-xs text-[var(--muted-foreground)]">
                    The API token shown under “Gerätepasswort &amp; API-Token” in your ERP user settings.
                  </p>
                </div>
              </>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
