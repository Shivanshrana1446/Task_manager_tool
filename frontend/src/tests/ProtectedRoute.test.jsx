import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const buildStore = (user) => {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (user) {
    store.dispatch(setCredentials({ user, accessToken: 'token' }));
  }
  return store;
};

const renderWithRole = (role) => {
  const store = buildStore(role ? { _id: 'u1', name: 'Test User', role } : null);

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<div>Admin panel</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('ProtectedRoute role gating', () => {
  it('redirects an unauthenticated visitor to login', () => {
    renderWithRole(null);
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects a non-admin away from an admin-only route', () => {
    renderWithRole('team_member');
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('lets an admin through to an admin-only route', () => {
    renderWithRole('admin');
    expect(screen.getByText('Admin panel')).toBeInTheDocument();
  });
});
