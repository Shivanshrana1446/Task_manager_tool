import { describe, it, expect } from 'vitest';
import authReducer, {
  setCredentials,
  clearCredentials,
  setAccessToken,
} from '../redux/slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    authChecked: false,
  };

  it('returns the initial state', () => {
    expect(authReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('sets credentials on login/register', () => {
    const user = { id: '1', name: 'Ada', email: 'ada@example.com', role: 'team_member' };
    const state = authReducer(initialState, setCredentials({ user, accessToken: 'token123' }));

    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe('token123');
    expect(state.isAuthenticated).toBe(true);
    expect(state.authChecked).toBe(true);
  });

  it('clears credentials on logout', () => {
    const loggedIn = {
      user: { id: '1' },
      accessToken: 'token123',
      isAuthenticated: true,
      authChecked: true,
    };
    const state = authReducer(loggedIn, clearCredentials());

    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.authChecked).toBe(true);
  });

  it('updates the access token independently (used after silent refresh)', () => {
    const state = authReducer(initialState, setAccessToken('newToken'));
    expect(state.accessToken).toBe('newToken');
  });
});
