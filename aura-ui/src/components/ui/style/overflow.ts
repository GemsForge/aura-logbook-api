import type { SxProps, Theme } from "@mui/material/styles";

export type AuraOverflow = "visible" | "auto" | "scroll" | "clip" | "scrollable";

export const DEFAULT_AURA_OVERFLOW: AuraOverflow = "visible";

const SCROLLABLE_MAX_HEIGHT = "min(100dvh - 2rem, 90vh)";

export function getOverflowStyles(_: Theme, overflow: AuraOverflow = DEFAULT_AURA_OVERFLOW): SxProps<Theme> {
  switch (overflow) {
    case "scrollable":
      return {
        maxHeight: SCROLLABLE_MAX_HEIGHT,
        overflowY: "auto",
      };
    case "scroll":
      return { overflowY: "scroll" };
    case "auto":
      return { overflowY: "auto" };
    case "clip":
      return { overflow: "clip" };
    case "visible":
    default:
      return { overflow: "visible" };
  }
}
