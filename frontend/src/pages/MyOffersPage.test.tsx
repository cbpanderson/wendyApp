import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import MyOffersPage from './MyOffersPage';

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

function renderAt(search: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/me/offers" element={<MyOffersPage />} />
      <Route path="/deals/:id" element={<div>Deal detail page</div>} />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { routerProps: { initialEntries: [`/me/offers${search}`] } }
  );
}

describe('MyOffersPage', () => {
  beforeEach(() => {
    signIn();
  });

  it('shows Sent and Received tabs', async () => {
    renderAt('?direction=sent');
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /sent/i })).toBeInTheDocument()
    );
    expect(screen.getByRole('tab', { name: /received/i })).toBeInTheDocument();
  });

  it('renders sent offers with status chip and a Withdraw button on PENDING', async () => {
    const user = userEvent.setup();
    renderAt('?direction=sent');
    await waitFor(() =>
      expect(screen.getByText(/Bob's honey/i)).toBeInTheDocument()
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
    const withdraw = screen.getByRole('button', { name: /withdraw/i });
    await user.click(withdraw);
    await waitFor(() =>
      expect(screen.getByText('Withdrawn')).toBeInTheDocument()
    );
  });

  it('renders received offers with Accept and Decline buttons on PENDING', async () => {
    renderAt('?direction=received');
    await waitFor(() =>
      expect(screen.getByText(/My eggs/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /^accept$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^decline$/i })).toBeInTheDocument();
  });

  it('declines a received offer and updates status', async () => {
    const user = userEvent.setup();
    renderAt('?direction=received');
    await waitFor(() =>
      expect(screen.getByText(/My eggs/i)).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /^decline$/i }));
    await waitFor(() => expect(screen.getByText('Declined')).toBeInTheDocument());
  });

  it('accepts a received offer and navigates to the deal page', async () => {
    const user = userEvent.setup();
    renderAt('?direction=received');
    await waitFor(() =>
      expect(screen.getByText(/My eggs/i)).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /^accept$/i }));
    await waitFor(() =>
      expect(screen.getByText(/deal detail page/i)).toBeInTheDocument()
    );
  });

  it('redirects unauthenticated users to /login', () => {
    sessionStorage.clear();
    renderAt('?direction=sent');
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
