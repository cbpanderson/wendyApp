import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import LoginPage from './LoginPage';

function HomeStub() {
  return <div>Home page</div>;
}

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeStub />} />
    </Routes>,
    { routerProps: { initialEntries: ['/login'] } }
  );
}

describe('LoginPage', () => {
  it('renders email + password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('on invalid credentials, shows an error and does not navigate', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(screen.queryByText(/home page/i)).not.toBeInTheDocument();
  });

  it('on valid credentials, stores token in sessionStorage and navigates home', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct-horse');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/home page/i)).toBeInTheDocument();
    const stored = sessionStorage.getItem('wendyapp.jwt');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).token).toBe('fake-jwt-token');
  });
});
