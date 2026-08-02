import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

vi.mock('../services/authApi', () => ({
  refreshTokenRequest: vi.fn().mockRejectedValue(new Error('no active session')),
  getMeRequest: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
  logoutRequest: vi.fn(),
  forgotPasswordRequest: vi.fn(),
  resetPasswordRequest: vi.fn(),
}));

import App from '../App';
import { store } from '../redux/store';
import { queryClient } from '../services/queryClient';

describe('App', () => {
  it('renders the home page for a signed-out visitor', async () => {
    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(
      await screen.findByText(/Project & Task Management System/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Sign in to manage your projects and tasks/i)).toBeInTheDocument();
  });
});
