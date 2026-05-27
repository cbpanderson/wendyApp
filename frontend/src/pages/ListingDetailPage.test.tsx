import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import ListingDetailPage from './ListingDetailPage';

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

function renderAt(id: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/listings/:id" element={<ListingDetailPage />} />
      <Route path="/login" element={<div>Login page</div>} />
      <Route path="/me/listings" element={<div>My listings page</div>} />
    </Routes>,
    { routerProps: { initialEntries: [`/listings/${id}`] } }
  );
}

describe('ListingDetailPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('shows title, description, photos, category, owner handle and rating', async () => {
    renderAt('listing-bobs');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Bob's honey/i })).toBeInTheDocument()
    );
    expect(screen.getByText(/Local raw wildflower honey/i)).toBeInTheDocument();
    // Category name + offerType label in the same caption line.
    expect(screen.getByText(/Honey · Either/i)).toBeInTheDocument();
    expect(screen.getByText(/@bob/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.5 stars/i)).toBeInTheDocument();
    // Two photos
    const imgs = screen.getAllByRole('img');
    expect(imgs.length).toBe(2);
  });

  it('shows "Log in to make an offer" when not signed in', async () => {
    renderAt('listing-bobs');
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /log in to make an offer/i })).toBeInTheDocument()
    );
    expect(screen.queryByRole('link', { name: /^make an offer$/i })).not.toBeInTheDocument();
  });

  it('shows "Make an Offer" when signed in and not the owner', async () => {
    signIn();
    renderAt('listing-bobs');
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /^make an offer$/i })).toBeInTheDocument()
    );
    expect(screen.queryByRole('button', { name: /^delete listing$/i })).not.toBeInTheDocument();
  });

  it('shows Edit/Delete (no Make an Offer) when owner views their own listing', async () => {
    signIn();
    renderAt('listing-mine');
    await waitFor(() =>
      expect(screen.getByText(/Dozen brown eggs/i)).toBeInTheDocument()
    );
    expect(screen.getByRole('link', { name: /edit listing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete listing/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^make an offer$/i })).not.toBeInTheDocument();
  });

  it('shows a not-found state for a deleted/missing listing', async () => {
    renderAt('listing-deleted');
    await waitFor(() =>
      expect(screen.getByText(/listing not found/i)).toBeInTheDocument()
    );
  });
});
