import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getDeviceById, postDevice } from '@/lib/api-client';
import { z } from 'zod';

/**
 * Authentication for ERP-user apps: the signed-in user owns a long-lived
 * **device** in the ERP (`POST /api/device`), and every API call carries
 * `Authorization: Basic base64(deviceId:token)` — the ERP's "device password"
 * model (ERP user settings "Gerätepasswort & API-Token").
 *
 * Two login paths end in the same stored session:
 * 1. **Credentials** — the user's normal email + password provisions a new
 *    device via `POST /api/device` (one device per app/browser).
 * 2. **Device access** — an existing device id + its device password/token
 *    (from the ERP's "Gerätepasswort & API-Token" settings) is verified via
 *    `GET /api/device/{id}`.
 *
 * Logout drops the stored device credentials client-side. The device itself
 * remains registered in the ERP; revoke it there (or call `DELETE
 * /api/device/{id}`) to truly deauthorize this browser.
 */

export interface DeviceSession {
  deviceId: number;
  token: string;
  /** Display name of the ERP user owning the device (from the device's `user` link). */
  userName?: string;
  /** Email on the device (credentials login). */
  userEmail?: string;
  mode: 'credentials' | 'device';
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

const STORAGE_KEY = 'minimal.session';

export function getSession(): DeviceSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DeviceSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: DeviceSession | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

/** Basic auth headers from the stored device — attached to every API request. */
export function apiAuthHeaders(): Record<string, string> {
  const session = getSession();
  if (!session) return {};
  return { Authorization: `Basic ${basicAuth(session.deviceId, session.token)}` };
}

function basicAuth(deviceId: number, token: string): string {
  return btoa(`${deviceId}:${token}`);
}

const DEVICE_NAME = 'ERP Minimal App';
const DEVICE_TYPE = 'browser';

/**
 * The device payload is intentionally parsed, never trusted: `POST /api/device`
 * answers 201 with a loose object, `GET /api/device/{id}` with a `Device`.
 * Only the fields the session needs are extracted.
 */
const devicePayloadSchema = z.object({
  _id: z.number(),
  token: z.string().optional(),
  email: z.string().optional(),
  externalAccess: z.boolean().optional(),
  user: z
    .object({ caption: z.string().optional(), title: z.string().optional() })
    .loose()
    .optional(),
});

type DevicePayload = z.infer<typeof devicePayloadSchema>;

function parseDevice(data: unknown): DevicePayload {
  const result = devicePayloadSchema.safeParse(data);
  if (!result.success) {
    throw new AuthError('The server answered with an unexpected device payload.');
  }
  return result.data;
}

function userCaption(device: DevicePayload): string | undefined {
  return device.user?.caption ?? device.user?.title ?? undefined;
}

function assertUsableDevice(device: DevicePayload) {
  if (device.externalAccess) {
    throw new AuthError('This device belongs to an external contact, not an ERP user.');
  }
}

/**
 * Login with the user's normal ERP credentials. Provisions a fresh device via
 * `POST /api/device { email, password, deviceName, deviceType }` and stores
 * the returned `_id` + token.
 */
export async function loginWithCredentials(email: string, password: string): Promise<DeviceSession> {
  let response: Awaited<ReturnType<typeof postDevice>>;
  try {
    response = await postDevice({ email, password, deviceName: DEVICE_NAME, deviceType: DEVICE_TYPE });
  } catch {
    throw new AuthError('Could not reach the ERP server. Check the connection and API base URL.');
  }
  // The generated type only declares the 201 variant; the fetch client resolves
  // every HTTP status, so widen before checking.
  const { status, data } = response as { status: number; data: unknown };
  if (status === 401 || status === 403) {
    throw new AuthError('Email or password is incorrect.');
  }
  if (status !== 201) {
    throw new AuthError(`Device provisioning failed (HTTP ${status}).`);
  }
  const device = parseDevice(response.data);
  if (!device.token) {
    throw new AuthError('The server did not return a device token.');
  }
  assertUsableDevice(device);
  const session: DeviceSession = {
    deviceId: device._id,
    token: device.token,
    userName: userCaption(device),
    userEmail: device.email ?? email,
    mode: 'credentials',
  };
  storeSession(session);
  return session;
}

/**
 * Login with an existing device: id + device password (token). Verifies the
 * pair against `GET /api/device/{id}` before anything is stored.
 */
export async function loginWithDevice(deviceId: number, token: string): Promise<DeviceSession> {
  let response: Awaited<ReturnType<typeof getDeviceById>>;
  try {
    response = await getDeviceById(deviceId, {
      headers: { Authorization: `Basic ${basicAuth(deviceId, token)}` },
    });
  } catch {
    throw new AuthError('Could not reach the ERP server. Check the connection and API base URL.');
  }
  // The generated type only declares the 200 variant; see loginWithCredentials.
  const { status, data } = response as { status: number; data: unknown };
  if (status === 401 || status === 403) {
    throw new AuthError('Device id or device password is incorrect.');
  }
  if (status === 404) {
    throw new AuthError('No device with this id exists.');
  }
  if (status !== 200) {
    throw new AuthError(`Device verification failed (HTTP ${status}).`);
  }
  const device = parseDevice(response.data);
  assertUsableDevice(device);
  const session: DeviceSession = {
    deviceId,
    token,
    userName: userCaption(device),
    userEmail: device.email,
    mode: 'device',
  };
  storeSession(session);
  return session;
}

/** Drops the stored device credentials (client-side logout). */
export function logout() {
  storeSession(null);
}

interface AuthContextValue {
  session: DeviceSession | null;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
  signInWithDevice: (deviceId: string, token: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DeviceSession | null>(() => getSession());

  const signInWithCredentials = useCallback(async (email: string, password: string) => {
    setSession(await loginWithCredentials(email, password));
  }, []);

  const signInWithDevice = useCallback(async (deviceId: string, token: string) => {
    const id = Number(deviceId.trim());
    if (!Number.isInteger(id) || id <= 0) {
      throw new AuthError('Please enter a numeric device id.');
    }
    if (!token.trim()) {
      throw new AuthError('Please enter the device password.');
    }
    setSession(await loginWithDevice(id, token));
  }, []);

  const signOut = useCallback(() => {
    logout();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, signInWithCredentials, signInWithDevice, signOut }),
    [session, signInWithCredentials, signInWithDevice, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
