/// <reference types="vite/client" />

/* eslint-disable no-unused-vars */
interface ImportMetaEnv {
  readonly VITE_USER_POOL_ID: string;
  readonly VITE_USER_POOL_CLIENT_ID: string;
  readonly VITE_USER_POOL_DOMAIN: string;
  readonly VITE_AWS_REGION: string;
  readonly VITE_REDIRECT_URI: string;
  readonly VITE_LOGOUT_URI: string;
  readonly VITE_API_URL: string;
}
/* eslint-enable no-unused-vars */
