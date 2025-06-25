// src/theme/index.ts
import { createTheme, type Theme } from "@mui/material/styles";
import { AuraColor } from "../features/mood/models/aura";
import { blue, green, grey, indigo, orange, pink, purple, red, yellow } from "@mui/material/colors";

/**
 * Returns a MUI theme tailored to the user’s selected aura color and intensity.
 * @param color     The aura hue (must match a key in auraShades).
 * @param intensity MUI shade level (e.g., 100, 200, ..., 900).
 */
export function getAuraTheme(
    color: AuraColor,
    intensity: number = 500
  ): Theme {
    // Map each aura to its full set of MUI color shades
    const auraShades: Record<AuraColor, Record<number, string>> = {
      red: red,
      orange: orange,
      yellow: yellow,
      green: green,
      blue: blue,
      indigo: indigo,
      violet: purple,
      gray: grey,
      pink: pink,
    };
  
    // Select the requested shade, defaulting to 500 if unavailable
    const shades = auraShades[color] || auraShades.blue;
    const mainColor = shades[intensity] || shades[500];
  
    return createTheme({
      palette: {
        primary: { main: mainColor },
        background: {
          default: "#fafafa",
          paper: "#fff",
        },
      },
      typography: {
        // Optional: add per-aura typography tweaks here
      },
      // Component overrides or shape settings can be added here
    });
  }
  
