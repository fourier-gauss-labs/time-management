/**
 * Configuration for AWS Cognito authentication.
 * These values are populated from CDK outputs after deployment.
 */
export interface AuthConfig {
  userPoolId: string;
  userPoolClientId: string;
  userPoolDomain: string;
  region: string;
  redirectUri: string;
  logoutUri: string;
}

/**
 * Authentication configuration.
 * In production, these would come from environment variables.
 * For now, these are placeholders that will be updated after CDK deployment.
 */
export const authConfig: AuthConfig = {
  userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
  userPoolDomain: import.meta.env.VITE_USER_POOL_DOMAIN || '',
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/callback',
  logoutUri: import.meta.env.VITE_LOGOUT_URI || 'http://localhost:5173',
};

/**
 * Tokens returned from Cognito authentication.
 */
export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * User information extracted from ID token.
 */
export interface User {
  sub: string;
  email: string;
}

const TOKEN_STORAGE_KEY = 'auth_tokens';
const USER_STORAGE_KEY = 'user';

/**
 * Authentication service for Cognito Hosted UI integration.
 */
export class AuthService {
  /**
   * Redirects to Cognito Hosted UI login page.
   */
  login(): void {
    const { userPoolDomain, userPoolClientId, redirectUri, region } = authConfig;

    if (!userPoolDomain || !userPoolClientId) {
      console.error('Auth configuration not set. Deploy CDK stack first.');
      return;
    }

    const hostedUIUrl = `https://${userPoolDomain}.auth.${region}.amazoncognito.com`;
    const loginUrl = `${hostedUIUrl}/login?client_id=${userPoolClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

    window.location.href = loginUrl;
  }

  /**
   * Logs out the user by clearing tokens and redirecting to Cognito logout.
   */
  logout(): void {
    const { userPoolDomain, userPoolClientId, logoutUri, region } = authConfig;

    // Clear local storage
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    if (!userPoolDomain || !userPoolClientId) {
      console.error('Auth configuration not set.');
      return;
    }

    const hostedUIUrl = `https://${userPoolDomain}.auth.${region}.amazoncognito.com`;
    const logoutUrl = `${hostedUIUrl}/logout?client_id=${userPoolClientId}&logout_uri=${encodeURIComponent(logoutUri)}`;

    window.location.href = logoutUrl;
  }

  /**
   * Handles the OAuth callback by exchanging authorization code for tokens.
   *
   * @param code - Authorization code from URL query parameter
   */
  async handleCallback(code: string): Promise<void> {
    const { userPoolDomain, userPoolClientId, redirectUri, region } = authConfig;

    const tokenEndpoint = `https://${userPoolDomain}.auth.${region}.amazoncognito.com/oauth2/token`;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: userPoolClientId,
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code for tokens');
    }

    const tokens = await response.json();

    // Store tokens
    const authTokens: AuthTokens = {
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };

    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(authTokens));

    // Decode and store user info from ID token
    const user = this.decodeIdToken(tokens.id_token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Gets the current authenticated user.
   *
   * @returns User object or null if not authenticated
   */
  getUser(): User | null {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Gets the current auth tokens.
   *
   * @returns Auth tokens or null if not authenticated
   */
  getTokens(): AuthTokens | null {
    const tokensJson = localStorage.getItem(TOKEN_STORAGE_KEY);
    return tokensJson ? JSON.parse(tokensJson) : null;
  }

  /**
   * Checks if the user is authenticated.
   *
   * @returns True if user has valid tokens
   */
  isAuthenticated(): boolean {
    return this.getTokens() !== null;
  }

  /**
   * Decodes the ID token JWT to extract user information.
   * Note: This is a simple base64 decode - doesn't verify signature.
   *
   * @param idToken - JWT ID token
   * @returns User information
   */
  private decodeIdToken(idToken: string): User {
    const parts = idToken.split('.');
    const payload = JSON.parse(atob(parts[1]));

    return {
      sub: payload.sub,
      email: payload.email,
    };
  }
}

export const authService = new AuthService();
