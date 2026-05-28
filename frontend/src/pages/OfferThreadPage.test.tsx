import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import OfferThreadPage from './OfferThreadPage';

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

function renderAt(offerId: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/offers/:id" element={<OfferThreadPage />} />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { routerProps: { initialEntries: [`/offers/${offerId}`] } }
  );
}

describe('OfferThreadPage', () => {
  beforeEach(() => {
    signIn();
  });

  it('renders offer summary and existing messages', async () => {
    renderAt('offer-1');
    await waitFor(() =>
      expect(screen.getByText("Bob's honey")).toBeInTheDocument()
    );
    expect(screen.getByText(/Hi there, is this still available/i)).toBeInTheDocument();
    expect(screen.getByText(/Yes, still available/i)).toBeInTheDocument();
    // @alice appears as message sender; @bob appears as other party + message sender
    expect(screen.getAllByText(/@alice/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/@bob/).length).toBeGreaterThan(0);
  });

  it('shows "No messages yet" when thread is empty', async () => {
    renderAt('offer-empty');
    await waitFor(() =>
      expect(screen.getByText("Bob's honey")).toBeInTheDocument()
    );
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('can type and send a new message', async () => {
    const user = userEvent.setup();
    renderAt('offer-1');
    await waitFor(() =>
      expect(screen.getByText("Bob's honey")).toBeInTheDocument()
    );
    const input = screen.getByLabelText(/write a message/i);
    await user.type(input, 'When can we meet?');
    await user.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('disables Send button and input when offer is WITHDRAWN', async () => {
    renderAt('offer-withdrawn');
    await waitFor(() =>
      expect(screen.getByText("Bob's honey")).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    expect(screen.getByLabelText(/write a message/i)).toBeDisabled();
  });

  it('redirects unauthenticated users to /login', () => {
    sessionStorage.clear();
    renderAt('offer-1');
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
