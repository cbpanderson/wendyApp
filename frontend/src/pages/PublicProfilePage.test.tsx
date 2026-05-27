import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import PublicProfilePage from './PublicProfilePage';

function renderPublicProfile(handle: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/users/:handle" element={<PublicProfilePage />} />
    </Routes>,
    { routerProps: { initialEntries: [`/users/${handle}`] } }
  );
}

describe('PublicProfilePage', () => {
  it('shows handle, ZIP, and bio for an existing user', async () => {
    renderPublicProfile('alice');
    await waitFor(() => expect(screen.getByText(/@alice/)).toBeInTheDocument());
    expect(screen.getByText(/Sequim, WA 98382/i)).toBeInTheDocument();
    expect(screen.getByTestId('public-profile-bio')).toHaveTextContent(/original bio/i);
  });

  it('never renders the email address anywhere in the DOM', async () => {
    const { container } = renderPublicProfile('alice');
    await waitFor(() => expect(screen.getByText(/@alice/)).toBeInTheDocument());
    expect(container.textContent).not.toContain('alice@example.com');
    expect(container.textContent).not.toContain('@example.com');
  });

  it('shows a friendly message when the user is not found', async () => {
    renderPublicProfile('no_such_user');
    await waitFor(() =>
      expect(screen.getByText(/no user with handle/i)).toBeInTheDocument()
    );
  });
});
