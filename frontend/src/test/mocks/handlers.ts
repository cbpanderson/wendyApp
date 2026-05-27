import { http, HttpResponse } from 'msw';

const userBase = {
  id: '11111111-1111-1111-1111-111111111111',
  handle: 'alice',
  bio: null as string | null,
  zipCode: '98382',
  averageStars: null as number | null,
  ratingCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
};

// Tiny in-memory store for the "current user" so PATCH /me reflects in subsequent GETs.
// Reset by test setup's afterEach via resetHandlers() if individual tests need it; the
// default value is restored when handlers are reset.
const currentUser = {
  ...userBase,
  email: 'alice@example.com',
  bio: 'Original bio' as string | null,
};

export const handlers = [
  // ---------- Auth ----------
  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; handle: string };

    if (body.email === 'taken@example.com') {
      return HttpResponse.json(
        { error: { code: 'EMAIL_IN_USE', message: 'Email is already in use' } },
        { status: 409 }
      );
    }
    if (body.handle === 'taken_handle') {
      return HttpResponse.json(
        { error: { code: 'HANDLE_IN_USE', message: 'Handle is already in use' } },
        { status: 409 }
      );
    }

    return HttpResponse.json(
      {
        token: 'fake-jwt-token',
        expiresAt: '2026-12-31T00:00:00Z',
        user: { ...userBase, email: body.email, handle: body.handle },
      },
      { status: 201 }
    );
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'alice@example.com' && body.password === 'correct-horse') {
      return HttpResponse.json(
        {
          token: 'fake-jwt-token',
          expiresAt: '2026-12-31T00:00:00Z',
          user: { ...currentUser },
        },
        { status: 200 }
      );
    }
    return HttpResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } },
      { status: 401 }
    );
  }),

  // ---------- Me ----------
  http.get('/api/v1/me', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    return HttpResponse.json({ ...currentUser });
  }),

  http.patch('/api/v1/me', async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return HttpResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    const body = (await request.json()) as { bio?: string };
    if (typeof body.bio === 'string' && body.bio.length > 500) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'bio: too long' } },
        { status: 400 }
      );
    }
    if (typeof body.bio === 'string') {
      currentUser.bio = body.bio.trim() === '' ? null : body.bio;
    }
    return HttpResponse.json({ ...currentUser });
  }),

  // ---------- Users (public) ----------
  http.get('/api/v1/users/:handle', ({ params }) => {
    const handle = params.handle as string;
    if (handle === 'alice') {
      return HttpResponse.json({
        handle: currentUser.handle,
        bio: currentUser.bio,
        zipCode: currentUser.zipCode,
        averageStars: currentUser.averageStars,
        ratingCount: currentUser.ratingCount,
        memberSince: currentUser.createdAt,
        activeListings: [],
      });
    }
    return HttpResponse.json(
      { error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 }
    );
  }),

  http.get('/api/v1/users/:handle/ratings', () =>
    HttpResponse.json({ items: [], total: 0, averageStars: 0 })
  ),
];
