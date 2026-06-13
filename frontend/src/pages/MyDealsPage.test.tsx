import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import MyDealsPage from './MyDealsPage';

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

function renderAt() {
  return renderWithProviders(
    <Routes>
      <Route path="/me/deals" element={<MyDealsPage />} />
      <Route path="/deals/:id" element={<div>Deal detail page</div>} />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/me/deals'] } }
  );
}

describe('MyDealsPage', () => {
  beforeEach(() => {
    signIn();
  });

  it('renders deal list with listing title, other party handle, status, and link to /deals/:id', async () => {
    renderAt();
    await waitFor(() =>
      expect(screen.getByText(/My eggs/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/@bob/i)).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    // Link to deal detail
    const link = screen.getByRole('link', { name: /My eggs/i });
    expect(link).toHaveAttribute('href', '/deals/deal-1');
  });

  it('redirects unauthenticated users to /login', () => {
    sessionStorage.clear();
    renderAt();
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
