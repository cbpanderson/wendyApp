import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import ProfilePage from './ProfilePage';

const seededUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'alice@example.com',
  handle: 'alice',
  bio: 'Original bio',
  zipCode: '98382',
  averageStars: null,
  ratingCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
};

function LoginStub() {
  return <div>Login page</div>;
}

function renderProfile() {
  return renderWithProviders(
    <Routes>
      <Route path="/me" element={<ProfilePage />} />
      <Route path="/login" element={<LoginStub />} />
    </Routes>,
    { routerProps: { initialEntries: ['/me'] } }
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    sessionStorage.setItem(
      'wendyapp.jwt',
      JSON.stringify({ token: 'fake-jwt-token', expiresAt: '2026-12-31T00:00:00Z' })
    );
    sessionStorage.setItem('wendyapp.user', JSON.stringify(seededUser));
  });

  it('shows handle, ZIP, and rating placeholder', async () => {
    renderProfile();
    expect(screen.getByText(/@alice/)).toBeInTheDocument();
    expect(screen.getByText(/Sequim, WA 98382/i)).toBeInTheDocument();
    expect(screen.getByText(/no ratings yet/i)).toBeInTheDocument();
    // bio is loaded either from initial state or after the fetch
    await waitFor(() =>
      expect(screen.getByTestId('profile-bio')).toHaveTextContent(/original bio/i)
    );
  });

  it('saves an updated bio and refreshes the display', async () => {
    const user = userEvent.setup();
    renderProfile();
    await waitFor(() =>
      expect(screen.getByTestId('profile-bio')).toHaveTextContent(/original bio/i)
    );

    await user.click(screen.getByRole('button', { name: /edit bio/i }));
    const bioField = screen.getByLabelText(/bio/i);
    await user.clear(bioField);
    await user.type(bioField, 'Updated bio!');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(screen.getByTestId('profile-bio')).toHaveTextContent(/updated bio!/i)
    );
  });

  it('redirects to /login when not authenticated', () => {
    sessionStorage.clear();
    renderProfile();
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });
});
