/** Restricts the toolbar to local development or a deliberately configured FIT build. */
export function shouldShowDeveloperToolbar({ dev, mode, enabled }: { dev: boolean; mode: string; enabled: string | undefined }): boolean {
  return enabled === "true" && (dev || mode === "fit");
}

const toolbarFlag = import.meta.env.VITE_AURA_DEV_TOOLBAR === "true";
export const developerToolbarEnabled = toolbarFlag && (import.meta.env.DEV || import.meta.env.MODE === "fit");
