import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import DealPage from './DealPage';

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

function renderAt(dealId: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/deals/:id" element={<DealPage />} />
    </Routes>,
    { routerProps: { initialEntries: [`/deals/${dealId}`] } }
  );
}

describe('DealPage', () => {
  beforeEach(() => {
    signIn();
  });

  it('renders deal summary with listing titles, participant handles, and status chip', async () => {
    renderAt('deal-1');
    await waitFor(() =>
      expect(screen.getByText(/My eggs/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Bob's honey/i)).toBeInTheDocument();
    expect(screen.getByText(/@alice/i)).toBeInTheDocument();
    expect(screen.getByText(/@bob/i)).toBeInTheDocument();
    expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
  });

  it('"Mark as complete" button is visible when ACCEPTED', async () => {
    renderAt('deal-1');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument()
    );
  });

  it('"Cancel" button is visible when ACCEPTED', async () => {
    renderAt('deal-1');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    );
  });

  it('clicking "Mark as complete" calls mutation and shows updated status', async () => {
    const user = userEvent.setup();
    renderAt('deal-1');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /mark as complete/i }));
    await waitFor(() =>
      expect(screen.getByText('COMPLETED_BY_A')).toBeInTheDocument()
    );
  });

  it('clicking "Cancel" calls mutation and shows CANCELLED status', async () => {
    const user = userEvent.setup();
    renderAt('deal-1');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.getByText('CANCELLED')).toBeInTheDocument()
    );
  });
});
