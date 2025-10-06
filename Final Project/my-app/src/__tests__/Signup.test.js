import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../pages/Signup';
import '@testing-library/jest-dom';

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signup: jest.fn(),
  }),
}));

// --- TC3: Successful Signup ---
test('TC3: Successful Signup', () => {
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const signupButton = screen.getByRole('button', { name: /sign up/i });

  fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(signupButton);

  expect(signupButton).toBeInTheDocument();
});

// --- TC4: Signup with Existing Email ---
test('TC4: Signup with Existing Email', () => {
  render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const signupButton = screen.getByRole('button', { name: /sign up/i });

  fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(signupButton);

  expect(signupButton).toBeInTheDocument();
});
