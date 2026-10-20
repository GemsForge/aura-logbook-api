// src/theme/index.ts
import { createTheme, type Theme } from "@mui/material/styles";
import { extendTheme as extendJoyTheme } from "@mui/joy/styles";
import { AuraColor } from "../features/mood/models/aura";
import { getAuraShade } from "./auraTheme";
import { blue, green, grey, indigo, orange, pink, purple, red, yellow } from "@mui/material/colors";
import { prismGarden } from "./prismGarden";

export { prismGarden } from "./prismGarden";

/**
 * Creates the Material UI adapter for Prism Garden.
 *
 * Neutral shell surfaces, typography, focus indicators, and control geometry
 * come from `prismGarden`. The selected aura color is exposed only through the
 * primary palette so existing mood and profile components can retain their
 * contextual accent behavior without recoloring the entire application shell.
 *
 * @param color User-selected aura hue. Unknown persisted values fall back to blue.
 * @param intensity Aura intensity from 0-100. Legacy MUI shade values are
 * normalized by `getAuraShade` for backward compatibility.
 * @returns A Material UI theme ready for `ThemeProvider`.
 */
export function getAuraTheme(
    color: AuraColor,
    intensity: number = 50
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
  
    // Select the shade represented by the persisted 0-100 intensity.
    const shades = auraShades[color] || auraShades.blue;
    const shade = getAuraShade(intensity);
    const mainColor = shades[shade] || shades[500];
  
    return createTheme({
      palette: {
        primary: { main: mainColor },
        secondary: { main: prismGarden.color.terracotta },
        background: {
          default: prismGarden.color.canvas,
          paper: prismGarden.color.surface,
        },
        text: {
          primary: prismGarden.color.ink,
          secondary: prismGarden.color.inkMuted,
        },
        divider: prismGarden.color.line,
      },
      typography: {
        fontFamily: prismGarden.font.body,
        h1: { fontFamily: prismGarden.font.display, fontWeight: 500 },
        h2: { fontFamily: prismGarden.font.display, fontWeight: 500 },
        h3: { fontFamily: prismGarden.font.display, fontWeight: 500 },
        h4: { fontFamily: prismGarden.font.display, fontWeight: 500 },
        h5: { fontFamily: prismGarden.font.display, fontWeight: 500 },
        h6: { fontFamily: prismGarden.font.display, fontWeight: 500 },
        button: { textTransform: "none", fontWeight: 600 },
      },
      shape: { borderRadius: 10 },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: prismGarden.color.canvas,
              color: prismGarden.color.ink,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              borderColor: prismGarden.color.line,
            },
          },
        },
        MuiButtonBase: {
          styleOverrides: {
            root: {
              "&:focus-visible": {
                outline: `3px solid ${prismGarden.color.focus}`,
                outlineOffset: 3,
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              minHeight: 44,
              borderRadius: prismGarden.radius.control,
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              minHeight: 44,
              backgroundColor: prismGarden.color.surface,
            },
          },
        },
      },
    });
  }

/**
 * Creates the Joy UI adapter for the same Prism Garden token vocabulary.
 *
 * Material UI and Joy UI coexist in the current application. Keeping both
 * adapters here prevents subtle differences in surfaces, typography, focus
 * rings, radii, and minimum touch-target sizes.
 *
 * @param color User-selected aura hue used for contextual primary accents.
 * @param intensity Aura intensity from 0-100.
 * @returns A Joy UI theme ready for `CssVarsProvider`.
 */
export function getAuraJoyTheme(color: AuraColor, intensity: number = 50) {
  const palettes: Record<AuraColor, Record<number, string>> = {
    red,
    orange,
    yellow,
    green,
    blue,
    indigo,
    violet: purple,
    gray: grey,
    pink,
  };
  const shades = palettes[color] ?? palettes.blue;
  const shade = getAuraShade(intensity);
  const selected = shades[shade] ?? shades[500];

  return extendJoyTheme({
    fontFamily: {
      body: prismGarden.font.body,
      display: prismGarden.font.display,
    },
    radius: {
      xs: "0.375rem",
      sm: "0.5rem",
      md: prismGarden.radius.control,
      lg: prismGarden.radius.card,
      xl: prismGarden.radius.shell,
    },
    shadow: {
      xs: "0 1px 2px rgba(53, 45, 44, 0.05)",
      sm: prismGarden.shadow.soft,
      md: prismGarden.shadow.soft,
      lg: prismGarden.shadow.raised,
      xl: prismGarden.shadow.raised,
    },
    colorSchemes: {
      light: {
        palette: {
          background: {
            body: prismGarden.color.canvas,
            surface: prismGarden.color.surface,
            popup: prismGarden.color.surface,
            level1: prismGarden.color.surfaceSoft,
            level2: prismGarden.color.stone,
            level3: prismGarden.color.line,
            tooltip: prismGarden.color.ink,
          },
          text: {
            primary: prismGarden.color.ink,
            secondary: prismGarden.color.inkMuted,
            tertiary: "#766D66",
            icon: prismGarden.color.inkMuted,
          },
          divider: prismGarden.color.line,
          focusVisible: prismGarden.color.focus,
          primary: {
            50: shades[50],
            100: shades[100],
            200: shades[200],
            300: shades[300],
            400: shades[400],
            500: shades[500],
            600: shades[600],
            700: shades[700],
            800: shades[800],
            900: shades[900],
            solidBg: selected,
            solidHoverBg: shades[Math.min(shade + 100, 900)] ?? shades[600],
            solidActiveBg: shades[Math.min(shade + 200, 900)] ?? shades[700],
          },
        },
      },
    },
    components: {
      JoyButton: {
        styleOverrides: {
          root: {
            minHeight: "44px",
            borderRadius: prismGarden.radius.control,
            fontWeight: 600,
            transition: "background-color 160ms ease, border-color 160ms ease, color 160ms ease",
          },
        },
      },
      JoyInput: {
        styleOverrides: {
          root: {
            minHeight: "44px",
            backgroundColor: prismGarden.color.surface,
            borderColor: prismGarden.color.line,
          },
        },
      },
      JoySheet: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}
  
