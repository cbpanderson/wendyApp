import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import SignupPage from './SignupPage';

/**
 * Frontend tests for US-1 (sign up).
 * Coverage per spec-docs/05-test-plan.md §4 → US-1:
 * - Form renders all fields
 * - Submit button disabled until form is valid
 * - Shows inline errors for invalid email, short password, missing 18+ checkbox
 * - On success, stores token in sessionStorage and navigates to home
 * - On 409 from server, shows "Email already in use" message
 */
function HomeStub() {
  return <div>Home page</div>;
}

function renderSignup() {
  return renderWithProviders(
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<HomeStub />} />
    </Routes>,
    { routerProps: { initialEntries: ['/signup'] } }
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
  await user.type(screen.getByLabelText(/password/i), 'correct-horse');
  await user.type(screen.getByLabelText(/handle/i), 'alice');
  // ZIP is pre-filled with 98382
  await user.click(screen.getByLabelText(/i confirm i am 18 or older/i));
}

describe('SignupPage', () => {
  it('renders all required fields', () => {
    renderSignup();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/handle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i confirm i am 18 or older/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('disables submit button until form is valid', async () => {
    const user = userEvent.setup();
    renderSignup();
    const submit = screen.getByRole('button', { name: /sign up/i });
    expect(submit).toBeDisabled();
    await fillValidForm(user);
    await waitFor(() => expect(submit).toBeEnabled());
  });

  it('shows inline error for invalid email', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.tab(); // blur to trigger validation
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  it('shows inline error for short password', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.tab();
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('keeps submit disabled if 18+ checkbox is unchecked', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct-horse');
    await user.type(screen.getByLabelText(/handle/i), 'alice');
    // Skip the 18+ checkbox
    const submit = screen.getByRole('button', { name: /sign up/i });
    expect(submit).toBeDisabled();
  });

  it('on success, stores token in sessionStorage and navigates to home', async () => {
    const user = userEvent.setup();
    renderSignup();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/home page/i)).toBeInTheDocument();

    const stored = sessionStorage.getItem('wendyapp.jwt');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!) as { token: string };
    expect(parsed.token).toBe('fake-jwt-token');
  });

  it('on 409 EMAIL_IN_USE, shows inline email-in-use error', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByLabelText(/email/i), 'taken@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct-horse');
    await user.type(screen.getByLabelText(/handle/i), 'newalice');
    await user.click(screen.getByLabelText(/i confirm i am 18 or older/i));
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    expect(await screen.findByText(/email is already in use/i)).toBeInTheDocument();
    // Should NOT have navigated
    expect(screen.queryByText(/home page/i)).not.toBeInTheDocument();
  });
});
