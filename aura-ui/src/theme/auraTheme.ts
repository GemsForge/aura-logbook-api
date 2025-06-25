// src/theme/auraThemes.ts
import type { PaletteOptions } from "@mui/material/styles";
import {
  red,
  orange,
  yellow,
  green,
  blue,
  indigo,
  purple,
  grey,
  pink,
} from "@mui/material/colors";
import type { AuraColor } from "../features/mood/models/aura";

export const auraPalettes: Record<AuraColor, PaletteOptions> = {
  red: { primary: { main: red[500] } },
  orange: { primary: { main: orange[500] } },
  yellow: { primary: { main: yellow[700] } },
  green: { primary: { main: green[500] } },
  blue: { primary: { main: blue[500] } },
  indigo: { primary: { main: indigo[500] } },
  violet: { primary: { main: purple[500] } },
  gray: { primary: { main: grey[500] } }, // neutral “reset” aura
  pink: { primary: { main: pink[500] } }, // playful, heart-centered
};
