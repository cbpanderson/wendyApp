import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import { server } from '../test/setup';
import MakeOfferPage from './MakeOfferPage';

const seededAlice = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'alice@example.com',
  handle: 'alice',
  bio: null,
  zipCode: '98382',
  averageStars: null,
  ratingCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
};

function signIn() {
  sessionStorage.setItem(
    'wendyapp.jwt',
    JSON.stringify({ token: 'fake-jwt-token', expiresAt: '2026-12-31T00:00:00Z' })
  );
  sessionStorage.setItem('wendyapp.user', JSON.stringify(seededAlice));
}

function renderAt(listingId: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/listings/:id/offer" element={<MakeOfferPage />} />
      <Route path="/me/offers" element={<div>My offers page</div>} />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { routerProps: { initialEntries: [`/listings/${listingId}/offer`] } }
  );
}

describe('MakeOfferPage', () => {
  beforeEach(() => {
    signIn();
  });

  it('renders target listing summary and both options when EITHER', async () => {
    renderAt('listing-bobs');
    await waitFor(() =>
      expect(screen.getByText(/Bob's honey/)).toBeInTheDocument()
    );
    const tradeRadio = screen.getByRole('radio', { name: /offer a trade/i });
    const giftRadio = screen.getByRole('radio', { name: /ask for as a gift/i });
    expect(tradeRadio).toBeEnabled();
    expect(giftRadio).toBeEnabled();
  });

  it('disables gift option for TRADE_ONLY listings', async () => {
    server.use(
      http.get('/api/v1/listings/:id', ({ params }) =>
        HttpResponse.json({
          id: String(params.id),
          owner: { handle: 'bob', averageStars: null, ratingCount: 0 },
          category: { id: 'cat-honey', name: 'Honey', slug: 'honey' },
          title: 'Trade-only honey',
          description: 'Trade only.',
          offerType: 'TRADE_ONLY',
          status: 'ACTIVE',
          photos: [],
          createdAt: '2026-05-01T00:00:00Z',
          updatedAt: '2026-05-01T00:00:00Z',
        })
      )
    );
    renderAt('listing-trade');
    await waitFor(() =>
      expect(screen.getByText(/Trade-only honey/)).toBeInTheDocument()
    );
    expect(screen.getByRole('radio', { name: /ask for as a gift/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /offer a trade/i })).toBeEnabled();
  });

  it('disables trade option for GIFT_ONLY listings', async () => {
    server.use(
      http.get('/api/v1/listings/:id', ({ params }) =>
        HttpResponse.json({
          id: String(params.id),
          owner: { handle: 'bob', averageStars: null, ratingCount: 0 },
          category: { id: 'cat-honey', name: 'Honey', slug: 'honey' },
          title: 'Free honey',
          description: 'Gift only.',
          offerType: 'GIFT_ONLY',
          status: 'ACTIVE',
          photos: [],
          createdAt: '2026-05-01T00:00:00Z',
          updatedAt: '2026-05-01T00:00:00Z',
        })
      )
    );
    renderAt('listing-gift');
    await waitFor(() =>
      expect(screen.getByText(/Free honey/)).toBeInTheDocument()
    );
    expect(screen.getByRole('radio', { name: /offer a trade/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /ask for as a gift/i })).toBeEnabled();
  });

  it('submits a gift request and navigates to /me/offers', async () => {
    const user = userEvent.setup();
    renderAt('listing-bobs');
    await waitFor(() =>
      expect(screen.getByText(/Bob's honey/)).toBeInTheDocument()
    );
    await user.click(screen.getByRole('radio', { name: /ask for as a gift/i }));
    await user.click(screen.getByRole('button', { name: /send offer/i }));
    await waitFor(() =>
      expect(screen.getByText(/my offers page/i)).toBeInTheDocument()
    );
  });

  it('shows server-side conflict error inline', async () => {
    server.use(
      http.post('/api/v1/listings/:id/offers', () =>
        HttpResponse.json(
          {
            error: {
              code: 'OFFER_CONFLICT',
              message: 'You already have a pending offer on this listing',
            },
          },
          { status: 409 }
        )
      )
    );
    const user = userEvent.setup();
    renderAt('listing-bobs');
    await waitFor(() =>
      expect(screen.getByText(/Bob's honey/)).toBeInTheDocument()
    );
    await user.click(screen.getByRole('radio', { name: /ask for as a gift/i }));
    await user.click(screen.getByRole('button', { name: /send offer/i }));
    await waitFor(() =>
      expect(screen.getByText(/already have a pending offer/i)).toBeInTheDocument()
    );
  });

  it('redirects unauthenticated users to /login', () => {
    sessionStorage.clear();
    renderAt('listing-bobs');
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
