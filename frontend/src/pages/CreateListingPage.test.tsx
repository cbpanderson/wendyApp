import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import { server } from '../test/setup';
import CreateListingPage from './CreateListingPage';

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
      <Route path="/listings/new" element={<CreateListingPage />} />
      <Route path="/me/listings" element={<div>My listings</div>} />
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/listings/new'] } }
  );
}

describe('CreateListingPage', () => {
  beforeEach(() => {
    sessionStorage.setItem(
      'wendyapp.jwt',
      JSON.stringify({ token: 'fake-jwt-token', expiresAt: '2026-12-31T00:00:00Z' })
    );
    sessionStorage.setItem('wendyapp.user', JSON.stringify(seededUser));
  });

  it('populates the category dropdown from /categories', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: /category/i }));
    expect(await screen.findByRole('option', { name: 'Fresh Eggs' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Lawn Care' })).toBeInTheDocument();
  });

  it('shows a validation error when title is too short', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument()
    );
    // pick a category
    await user.click(screen.getByRole('combobox', { name: /category/i }));
    await user.click(await screen.findByRole('option', { name: 'Fresh Eggs' }));

    await user.type(screen.getByLabelText(/title/i), 'abc');
    await user.click(screen.getByRole('button', { name: /create listing/i }));

    await waitFor(() =>
      expect(screen.getByText(/at least 5 characters/i)).toBeInTheDocument()
    );
  });

  it('submits a valid listing and navigates to my listings', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument()
    );

    await user.click(screen.getByRole('combobox', { name: /category/i }));
    await user.click(await screen.findByRole('option', { name: 'Fresh Eggs' }));
    await user.type(screen.getByLabelText(/title/i), 'Fresh garden eggs');
    await user.type(screen.getByLabelText(/description/i), 'Backyard hens.');
    await user.click(screen.getByRole('button', { name: /create listing/i }));

    await waitFor(() => expect(screen.getByText(/my listings/i)).toBeInTheDocument());
  });

  it('shows a server-side validation error inline', async () => {
    server.use(
      http.post('/api/v1/listings', () =>
        HttpResponse.json(
          { error: { code: 'VALIDATION_FAILED', message: 'categoryId: unknown category' } },
          { status: 400 }
        )
      )
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument()
    );

    await user.click(screen.getByRole('combobox', { name: /category/i }));
    await user.click(await screen.findByRole('option', { name: 'Fresh Eggs' }));
    await user.type(screen.getByLabelText(/title/i), 'Fresh garden eggs');
    await user.click(screen.getByRole('button', { name: /create listing/i }));

    await waitFor(() =>
      expect(screen.getByText(/unknown category/i)).toBeInTheDocument()
    );
  });

  it('redirects unauthenticated users to /login', () => {
    sessionStorage.clear();
    renderPage();
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
