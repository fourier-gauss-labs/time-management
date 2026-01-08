import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/auth';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getUser', () => {
    it('returns null when no user is stored', () => {
      const user = authService.getUser();
      expect(user).toBeNull();
    });

    it('returns user from localStorage when stored', () => {
      const mockUser = { sub: '123', email: 'test@example.com' };
      localStorage.setItem('user', JSON.stringify(mockUser));

      const user = authService.getUser();
      expect(user).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no tokens are stored', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns true when tokens exist in localStorage', () => {
      const mockTokens = {
        idToken: 'id-token',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      localStorage.setItem('auth_tokens', JSON.stringify(mockTokens));

      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('logout', () => {
    it('clears user and tokens from localStorage', () => {
      localStorage.setItem('user', JSON.stringify({ sub: '123', email: 'test@example.com' }));
      localStorage.setItem('auth_tokens', JSON.stringify({ idToken: 'token' }));

      // Mock window.location.href to prevent actual redirect in test
      delete (window as any).location;
      window.location = { href: '' } as any;

      authService.logout();

      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('auth_tokens')).toBeNull();
    });
  });
});
