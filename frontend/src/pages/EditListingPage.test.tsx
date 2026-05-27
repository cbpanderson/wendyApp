import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import EditListingPage from './EditListingPage';

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
      <Route path="/listings/:id/edit" element={<EditListingPage />} />
      <Route path="/me/listings" element={<div>My listings</div>} />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/listings/listing-1/edit'] } }
  );
}

describe('EditListingPage', () => {
  beforeEach(() => {
    sessionStorage.setItem(
      'wendyapp.jwt',
      JSON.stringify({ token: 'fake-jwt-token', expiresAt: '2026-12-31T00:00:00Z' })
    );
    sessionStorage.setItem('wendyapp.user', JSON.stringify(seededUser));
  });

  it('pre-populates the form with the current listing values', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Dozen brown eggs')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue(/Backyard hens, super fresh/)).toBeInTheDocument();
  });
});
