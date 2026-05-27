import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import MyListingsPage from './MyListingsPage';

const seededUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'alice@example.com',
  handle: 'alice',
  bio: null,
  zipCode: '98382',
  averageStars: null,
  ratingCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
};

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/me/listings" element={<MyListingsPage />} />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/me/listings'] } }
  );
}

describe('MyListingsPage', () => {
  beforeEach(() => {
    sessionStorage.setItem(
      'wendyapp.jwt',
      JSON.stringify({ token: 'fake-jwt-token', expiresAt: '2026-12-31T00:00:00Z' })
    );
    sessionStorage.setItem('wendyapp.user', JSON.stringify(seededUser));
  });

  it('lists owned listings with edit and delete buttons', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Dozen brown eggs/i)).toBeInTheDocument()
    );
    // Edit is a Link (renders as <a>) styled as a button.
    expect(screen.getByRole('link', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });

  it('shows a confirm dialog before deleting', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Dozen brown eggs/i)).toBeInTheDocument()
    );
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(await screen.findByText(/delete this listing/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete$/i, hidden: false }));
    await waitFor(() =>
      expect(screen.queryByText(/Dozen brown eggs/i)).not.toBeInTheDocument()
    );
  });

  it('redirects unauthenticated users', () => {
    sessionStorage.clear();
    renderPage();
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
