// src/theme/index.ts
import { createTheme, type Theme } from "@mui/material/styles";
import { auraPalettes } from "./auraTheme";
import type { AuraColor } from "../features/mood/models/aura";

export function getAuraTheme(color: AuraColor, intensity = 500): Theme {
  const base = auraPalettes[color];
  return createTheme({
    palette: {
      ...base,
      background: { default: "#fafafa", paper: "#fff" },
    },
  });
}
