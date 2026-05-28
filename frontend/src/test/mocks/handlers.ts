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

  // ---------- Categories ----------
  http.get('/api/v1/categories', () =>
    HttpResponse.json([
      { id: 'cat-eggs', name: 'Fresh Eggs', slug: 'fresh-eggs' },
      { id: 'cat-lawn', name: 'Lawn Care', slug: 'lawn-care' },
      { id: 'cat-honey', name: 'Honey', slug: 'honey' },
    ])
  ),

  // ---------- Listings ----------
  http.get('/api/v1/me/listings', () =>
    HttpResponse.json({
      items: [
        {
          id: 'listing-1',
          owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
          category: { id: 'cat-eggs', name: 'Fresh Eggs', slug: 'fresh-eggs' },
          title: 'Dozen brown eggs',
          description: 'Backyard hens, super fresh.',
          offerType: 'EITHER',
          status: 'ACTIVE',
          photos: [],
          createdAt: '2026-05-01T00:00:00Z',
          updatedAt: '2026-05-01T00:00:00Z',
        },
      ],
      total: 1,
    })
  ),

  http.get('/api/v1/listings/:id', ({ params }) => {
    const id = String(params.id);
    if (id === 'listing-deleted' || id === 'listing-missing') {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Listing not found' } },
        { status: 404 }
      );
    }
    if (id === 'listing-bobs') {
      return HttpResponse.json({
        id,
        owner: { handle: 'bob', averageStars: 4.5, ratingCount: 2 },
        category: { id: 'cat-honey', name: 'Honey', slug: 'honey' },
        title: "Bob's honey",
        description: 'Local raw wildflower honey.',
        offerType: 'EITHER',
        status: 'ACTIVE',
        photos: [
          { id: 'p1', url: '/uploads/bobs-honey-1.jpg', position: 0 },
          { id: 'p2', url: '/uploads/bobs-honey-2.jpg', position: 1 },
        ],
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      });
    }
    // Default: Alice's listing (owner matches the seeded test user).
    return HttpResponse.json({
      id,
      owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
      category: { id: 'cat-eggs', name: 'Fresh Eggs', slug: 'fresh-eggs' },
      title: 'Dozen brown eggs',
      description: 'Backyard hens, super fresh.',
      offerType: 'EITHER',
      status: 'ACTIVE',
      photos: [],
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
    });
  }),

  http.post('/api/v1/listings', async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      categoryId: string;
      description: string;
      offerType: string;
    };
    if (body.title.length < 5) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_FAILED', message: 'title: too short' } },
        { status: 400 }
      );
    }
    return HttpResponse.json(
      {
        id: 'listing-new',
        owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
        category: { id: body.categoryId, name: 'Fresh Eggs', slug: 'fresh-eggs' },
        title: body.title,
        description: body.description,
        offerType: body.offerType,
        status: 'ACTIVE',
        photos: [],
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
      { status: 201 }
    );
  }),

  http.patch('/api/v1/listings/:id', async ({ params, request }) => {
    const body = (await request.json()) as { title?: string };
    return HttpResponse.json({
      id: params.id,
      owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
      category: { id: 'cat-eggs', name: 'Fresh Eggs', slug: 'fresh-eggs' },
      title: body.title ?? 'Dozen brown eggs',
      description: 'Backyard hens, super fresh.',
      offerType: 'EITHER',
      status: 'ACTIVE',
      photos: [],
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-02T00:00:00Z',
    });
  }),

  http.delete('/api/v1/listings/:id', () => new HttpResponse(null, { status: 204 })),

  http.post('/api/v1/listings/:id/photos', () =>
    HttpResponse.json(
      { id: 'photo-1', url: '/uploads/photo-1.jpg', position: 0 },
      { status: 201 }
    )
  ),

  // ---------- US-4 (browse) ----------
  http.get('/api/v1/listings', ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId') ?? undefined;
    const q = url.searchParams.get('q')?.toLowerCase() ?? undefined;
    const offerType = url.searchParams.get('offerType') ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const offset = Number(url.searchParams.get('offset') ?? '0');

    const all = [
      {
        id: 'listing-honey',
        owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
        category: { id: 'cat-honey', name: 'Honey', slug: 'honey' },
        title: 'Local raw honey',
        description: 'A jar of wildflower honey.',
        offerType: 'EITHER',
        status: 'ACTIVE',
        photos: [],
        createdAt: '2026-05-03T00:00:00Z',
        updatedAt: '2026-05-03T00:00:00Z',
      },
      {
        id: 'listing-eggs',
        owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
        category: { id: 'cat-eggs', name: 'Fresh Eggs', slug: 'fresh-eggs' },
        title: 'Dozen brown eggs',
        description: 'Backyard hens, super fresh.',
        offerType: 'GIFT_ONLY',
        status: 'ACTIVE',
        photos: [],
        createdAt: '2026-05-02T00:00:00Z',
        updatedAt: '2026-05-02T00:00:00Z',
      },
      {
        id: 'listing-lawn',
        owner: { handle: 'bob', averageStars: 4.5, ratingCount: 2 },
        category: { id: 'cat-lawn', name: 'Lawn Care', slug: 'lawn-care' },
        title: 'Lawn mowing service',
        description: 'One free mow.',
        offerType: 'TRADE_ONLY',
        status: 'ACTIVE',
        photos: [],
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
    ];

    let filtered = all;
    if (categoryId) filtered = filtered.filter((l) => l.category.id === categoryId);
    if (offerType) filtered = filtered.filter((l) => l.offerType === offerType);
    if (q) {
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q)
      );
    }

    const items = filtered.slice(offset, offset + limit);
    return HttpResponse.json({ items, total: filtered.length });
  }),

  // ---------- US-5 (detail) ----------
  // (Note: handlers earlier in the array win, so the simple /listings/:id stub above
  // currently handles the detail. We extend it by replacing that one to support
  // 404 for known-deleted IDs and a richer payload for the detail-test seed.)

  // ---------- US-6 (offers) ----------
  http.post('/api/v1/listings/:id/offers', async ({ params, request }) => {
    const listingId = String(params.id);
    const body = (await request.json()) as {
      offerType: 'TRADE' | 'GIFT_REQUEST';
      offeredListingId?: string | null;
      message?: string;
    };
    if (listingId === 'listing-own') {
      return HttpResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You cannot make an offer on your own listing' } },
        { status: 403 }
      );
    }
    if (listingId === 'listing-dup') {
      return HttpResponse.json(
        { error: { code: 'OFFER_CONFLICT', message: 'You already have a pending offer on this listing' } },
        { status: 409 }
      );
    }
    return HttpResponse.json(
      {
        id: 'offer-new',
        listing: {
          id: listingId,
          owner: { handle: 'bob', averageStars: null, ratingCount: 0 },
          category: { id: 'cat-honey', name: 'Honey', slug: 'honey' },
          title: "Bob's honey",
          description: 'Local raw.',
          offerType: 'EITHER',
          status: 'ACTIVE',
          photos: [],
          createdAt: '2026-05-01T00:00:00Z',
          updatedAt: '2026-05-01T00:00:00Z',
        },
        fromUser: { handle: 'alice', averageStars: null, ratingCount: 0 },
        toUser: { handle: 'bob', averageStars: null, ratingCount: 0 },
        offerType: body.offerType,
        offeredListing:
          body.offerType === 'TRADE' && body.offeredListingId
            ? {
                id: body.offeredListingId,
                owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
                category: { id: 'cat-eggs', name: 'Fresh Eggs', slug: 'fresh-eggs' },
                title: 'Dozen brown eggs',
                description: 'Backyard hens.',
                offerType: 'EITHER',
                status: 'ACTIVE',
                photos: [],
                createdAt: '2026-05-01T00:00:00Z',
                updatedAt: '2026-05-01T00:00:00Z',
              }
            : null,
        message: body.message ?? null,
        status: 'PENDING',
        createdAt: '2026-05-10T00:00:00Z',
        respondedAt: null,
      },
      { status: 201 }
    );
  }),

  http.get('/api/v1/me/offers', ({ request }) => {
    const url = new URL(request.url);
    const direction = url.searchParams.get('direction') ?? 'sent';
    const baseListing = {
      id: 'listing-bobs',
      owner: { handle: 'bob', averageStars: null, ratingCount: 0 },
      category: { id: 'cat-honey', name: 'Honey', slug: 'honey' },
      title: "Bob's honey",
      description: 'Local raw.',
      offerType: 'EITHER',
      status: 'ACTIVE',
      photos: [],
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-01T00:00:00Z',
    };
    const sent = [
      {
        id: 'offer-sent-1',
        listing: baseListing,
        fromUser: { handle: 'alice', averageStars: null, ratingCount: 0 },
        toUser: { handle: 'bob', averageStars: null, ratingCount: 0 },
        offerType: 'GIFT_REQUEST',
        offeredListing: null,
        message: null,
        status: 'PENDING',
        createdAt: '2026-05-10T00:00:00Z',
        respondedAt: null,
      },
    ];
    const received = [
      {
        id: 'offer-rec-1',
        listing: {
          ...baseListing,
          id: 'listing-mine',
          owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
          title: 'My eggs',
        },
        fromUser: { handle: 'bob', averageStars: null, ratingCount: 0 },
        toUser: { handle: 'alice', averageStars: null, ratingCount: 0 },
        offerType: 'TRADE',
        offeredListing: baseListing,
        message: 'Trade?',
        status: 'PENDING',
        createdAt: '2026-05-09T00:00:00Z',
        respondedAt: null,
      },
    ];
    const items = direction === 'received' ? received : sent;
    return HttpResponse.json({ items, total: items.length });
  }),

  http.post('/api/v1/offers/:id/accept', ({ params }) =>
    HttpResponse.json({
      id: 'deal-new',
      offerId: String(params.id),
      dealType: 'TRADE',
      participantA: { handle: 'alice', averageStars: null, ratingCount: 0 },
      participantB: { handle: 'bob', averageStars: null, ratingCount: 0 },
      listingA: {
        id: 'listing-mine',
        owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
        category: { id: 'cat-eggs', name: 'Fresh Eggs', slug: 'fresh-eggs' },
        title: 'My eggs',
        description: '',
        offerType: 'EITHER',
        status: 'ACTIVE',
        photos: [],
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
      listingB: null,
      status: 'ACCEPTED',
      acceptedAt: '2026-05-11T00:00:00Z',
      completedAt: null,
      cancelledAt: null,
      cancelledByUserId: null,
    })
  ),

  http.post('/api/v1/offers/:id/decline', ({ params }) =>
    HttpResponse.json({
      id: String(params.id),
      listing: {
        id: 'listing-mine',
        owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
        category: { id: 'cat-eggs', name: 'Fresh Eggs', slug: 'fresh-eggs' },
        title: 'My eggs',
        description: '',
        offerType: 'EITHER',
        status: 'ACTIVE',
        photos: [],
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
      fromUser: { handle: 'bob', averageStars: null, ratingCount: 0 },
      toUser: { handle: 'alice', averageStars: null, ratingCount: 0 },
      offerType: 'TRADE',
      offeredListing: null,
      message: null,
      status: 'DECLINED',
      createdAt: '2026-05-09T00:00:00Z',
      respondedAt: '2026-05-11T00:00:00Z',
    })
  ),

  http.post('/api/v1/offers/:id/withdraw', ({ params }) =>
    HttpResponse.json({
      id: String(params.id),
      listing: {
        id: 'listing-bobs',
        owner: { handle: 'bob', averageStars: null, ratingCount: 0 },
        category: { id: 'cat-honey', name: 'Honey', slug: 'honey' },
        title: "Bob's honey",
        description: '',
        offerType: 'EITHER',
        status: 'ACTIVE',
        photos: [],
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z',
      },
      fromUser: { handle: 'alice', averageStars: null, ratingCount: 0 },
      toUser: { handle: 'bob', averageStars: null, ratingCount: 0 },
      offerType: 'GIFT_REQUEST',
      offeredListing: null,
      message: null,
      status: 'WITHDRAWN',
      createdAt: '2026-05-10T00:00:00Z',
      respondedAt: '2026-05-11T00:00:00Z',
    })
  ),
];
