// src/theme/auraThemes.ts
import type { SimplePaletteColorOptions } from "@mui/material/styles";
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

export type ShadeKey = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * Extend each aura entry with full MUI color shades keyed by intensity,
 * plus a `primary` alias (defaults to 500 shade).
 */
export type AuraPaletteEntry = {
  primary: SimplePaletteColorOptions;
} & {
  [K in ShadeKey]: SimplePaletteColorOptions;
};

export const auraPalettes: Record<AuraColor, AuraPaletteEntry> = {
  red: {
    100: { main: red[100] },
    200: { main: red[200] },
    300: { main: red[300] },
    400: { main: red[400] },
    500: { main: red[500] },
    600: { main: red[600] },
    700: { main: red[700] },
    800: { main: red[800] },
    900: { main: red[900] },
    primary: { main: red[500] },
  },
  orange: {
    100: { main: orange[100] },
    200: { main: orange[200] },
    300: { main: orange[300] },
    400: { main: orange[400] },
    500: { main: orange[500] },
    600: { main: orange[600] },
    700: { main: orange[700] },
    800: { main: orange[800] },
    900: { main: orange[900] },
    primary: { main: orange[500] },
  },
  yellow: {
    100: { main: yellow[100] },
    200: { main: yellow[200] },
    300: { main: yellow[300] },
    400: { main: yellow[400] },
    500: { main: yellow[500] },
    600: { main: yellow[600] },
    700: { main: yellow[700] },
    800: { main: yellow[800] },
    900: { main: yellow[900] },
    primary: { main: yellow[700] },
  },
  green: {
    100: { main: green[100] },
    200: { main: green[200] },
    300: { main: green[300] },
    400: { main: green[400] },
    500: { main: green[500] },
    600: { main: green[600] },
    700: { main: green[700] },
    800: { main: green[800] },
    900: { main: green[900] },
    primary: { main: green[500] },
  },
  blue: {
    100: { main: blue[100] },
    200: { main: blue[200] },
    300: { main: blue[300] },
    400: { main: blue[400] },
    500: { main: blue[500] },
    600: { main: blue[600] },
    700: { main: blue[700] },
    800: { main: blue[800] },
    900: { main: blue[900] },
    primary: { main: blue[500] },
  },
  indigo: {
    100: { main: indigo[100] },
    200: { main: indigo[200] },
    300: { main: indigo[300] },
    400: { main: indigo[400] },
    500: { main: indigo[500] },
    600: { main: indigo[600] },
    700: { main: indigo[700] },
    800: { main: indigo[800] },
    900: { main: indigo[900] },
    primary: { main: indigo[500] },
  },
  violet: {
    100: { main: purple[100] },
    200: { main: purple[200] },
    300: { main: purple[300] },
    400: { main: purple[400] },
    500: { main: purple[500] },
    600: { main: purple[600] },
    700: { main: purple[700] },
    800: { main: purple[800] },
    900: { main: purple[900] },
    primary: { main: purple[500] },
  },
  gray: {
    100: { main: grey[100] },
    200: { main: grey[200] },
    300: { main: grey[300] },
    400: { main: grey[400] },
    500: { main: grey[500] },
    600: { main: grey[600] },
    700: { main: grey[700] },
    800: { main: grey[800] },
    900: { main: grey[900] },
    primary: { main: grey[500] },
  },
  pink: {
    100: { main: pink[100] },
    200: { main: pink[200] },
    300: { main: pink[300] },
    400: { main: pink[400] },
    500: { main: pink[500] },
    600: { main: pink[600] },
    700: { main: pink[700] },
    800: { main: pink[800] },
    900: { main: pink[900] },
    primary: { main: pink[500] },
  },
};
