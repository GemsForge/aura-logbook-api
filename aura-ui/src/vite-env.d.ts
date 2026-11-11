/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" shows account recovery in deployed builds; match the API's PasswordReset:Enabled (#335). */
  readonly VITE_PASSWORD_RESET_ENABLED?: string;
}
