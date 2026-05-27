/**
 * Minimal fetch wrapper that:
 * - prefixes /api/v1
 * - sends the JWT from sessionStorage as a bearer token
 * - parses the standard error envelope from spec-docs/03-api.yaml
 *
 * NOTE: This will be replaced by the auto-generated OpenAPI client
 * (`npm run generate-api`) once we have more endpoints. Hand-written for now.
 */
const BASE = '/api/v1';
const TOKEN_KEY = 'wendyapp.jwt';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export interface AuthToken {
  token: string;
  expiresAt: string;
}

export const tokenStorage = {
  get(): AuthToken | null {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthToken;
    } catch {
      return null;
    }
  },
  set(t: AuthToken): void {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  },
  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

export async function api<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const token = tokenStorage.get();
  if (token) headers.set('Authorization', `Bearer ${token.token}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } }).error;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `Request failed with status ${res.status}`
    );
  }
  return body as T;
}
