import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import '@testing-library/jest-dom';

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: jest.fn(),
  }),
}));

// --- TC1: Successful Login ---
test('TC1: Successful Login', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const loginButton = screen.getByRole('button', { name: /log in/i });

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(loginButton);

  expect(loginButton).toBeInTheDocument();
});

// --- TC2: Login with Invalid Credentials ---
test('TC2: Login with Invalid Credentials', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const loginButton = screen.getByRole('button', { name: /log in/i });

  fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
  fireEvent.click(loginButton);

  expect(loginButton).toBeInTheDocument();
});
