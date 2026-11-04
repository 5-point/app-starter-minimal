import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/auth/auth';
import { getStoredServerUrl } from '@/lib/server-url';

/** Placeholder landing page: proof of a working login, nothing else yet. */
export function HomePage() {
  const { session } = useAuth();
  const serverUrl = getStoredServerUrl();

  return (
    <div>
      <PageHeader title="Home" description="You are signed in. This template has no feature pages yet." />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
          <CardDescription>Device credentials stored by the login</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <p>
            <span className="text-[var(--muted-foreground)]">User:</span>{' '}
            {session?.userName ?? session?.userEmail ?? '—'}
          </p>
          <p>
            <span className="text-[var(--muted-foreground)]">Device:</span> {session?.deviceId ?? '—'} (
            {session?.mode === 'device' ? 'device access' : 'credentials login'})
          </p>
          <p>
            <span className="text-[var(--muted-foreground)]">Server:</span> {serverUrl ?? '—'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
