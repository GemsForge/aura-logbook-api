/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set only for local development or the dedicated FIT Pages build. */
  readonly VITE_AURA_DEV_TOOLBAR?: string;
  /** FIT or PRO label displayed by the explicitly enabled developer toolbar build. */
  readonly VITE_AURA_ENV?: string;
  /** "true" shows account recovery in deployed builds; match the API's PasswordReset:Enabled (#335). */
  readonly VITE_PASSWORD_RESET_ENABLED?: string;
}
