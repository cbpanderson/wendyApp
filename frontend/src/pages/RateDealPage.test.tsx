import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import RateDealPage from './RateDealPage';

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

function signOut() {
  sessionStorage.removeItem('wendyapp.jwt');
  sessionStorage.removeItem('wendyapp.user');
}

function renderAt(dealId: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/deals/:id/rate" element={<RateDealPage />} />
      <Route path="/login" element={<div>Login page</div>} />
      <Route path="/users/:handle" element={<div>Profile page</div>} />
    </Routes>,
    { routerProps: { initialEntries: [`/deals/${dealId}/rate`] } }
  );
}

describe('RateDealPage', () => {
  beforeEach(() => {
    signIn();
  });

  it('renders "Rating @bob" (other party handle)', async () => {
    // The deal handler returns participantA=alice, participantB=bob
    // Alice is logged in, so the other party is bob
    renderAt('deal-1');
    await waitFor(() =>
      expect(screen.getByText(/Rating @bob/i)).toBeInTheDocument()
    );
  });

  it('can select stars and submit', async () => {
    const user = userEvent.setup();
    renderAt('deal-1');
    await waitFor(() =>
      expect(screen.getByText(/Rating @bob/i)).toBeInTheDocument()
    );

    // Click the 5 star toggle button
    const fiveStar = screen.getByRole('button', { name: /5 star/i });
    await user.click(fiveStar);

    await user.click(screen.getByRole('button', { name: /submit rating/i }));

    // After successful submission, we navigate away (profile page)
    await waitFor(() =>
      expect(screen.getByText('Profile page')).toBeInTheDocument()
    );
  });

  it('shows error if deal already rated (409 from server shown as inline error)', async () => {
    const user = userEvent.setup();
    renderAt('deal-already-rated');
    await waitFor(() =>
      expect(screen.getByText(/Rating @bob/i)).toBeInTheDocument()
    );

    // Click the 3 star toggle button
    const threeStar = screen.getByRole('button', { name: /3 star/i });
    await user.click(threeStar);

    await user.click(screen.getByRole('button', { name: /submit rating/i }));

    await waitFor(() =>
      expect(screen.getByText(/already submitted a rating/i)).toBeInTheDocument()
    );
  });

  it('redirects unauthenticated users to /login', async () => {
    signOut();
    renderAt('deal-1');
    await waitFor(() =>
      expect(screen.getByText('Login page')).toBeInTheDocument()
    );
  });
});
