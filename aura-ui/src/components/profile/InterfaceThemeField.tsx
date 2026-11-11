import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { interfaceThemes, getInterfaceThemeTokens } from "@/theme";
import type { InterfaceTheme, InterfaceMode } from "@/features/auth/models/InterfaceTheme";

interface InterfaceThemeFieldProps {
  value: InterfaceTheme;
  /** Swatches reflect brightness without changing it when a family is selected. */
  mode?: InterfaceMode;
  onChange: (theme: InterfaceTheme) => void;
}

/**
 * Compact, keyboard-selectable theme chips. Each chip is a visually hidden radio whose
 * accessible name is the theme name; the selected name is also shown as text so the
 * choice is never conveyed by color alone. Chips keep a 44px touch target.
 */
export function InterfaceThemeField({ value, mode = "dark", onChange }: InterfaceThemeFieldProps) {
  return (
    <FormControl component="fieldset" fullWidth sx={{ minWidth: 0 }}>
      <FormLabel component="legend" id="interface-theme-label" sx={{ fontSize: "0.875rem" }}>
        Interface theme
      </FormLabel>
      <RadioGroup
        aria-labelledby="interface-theme-label"
        name="interfaceTheme"
        value={value}
        onChange={(event) => onChange(event.target.value as InterfaceTheme)}
        sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
        {interfaceThemes.map((theme) => {
          const tokens = getInterfaceThemeTokens(theme, mode);
          const selected = value === theme;
          return (
            <Tooltip key={theme} title={theme} disableInteractive>
              <FormControlLabel
                value={theme}
                control={<Radio size="small" sx={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />}
                label={<Box component="span" sx={{ position: "absolute", top: 0, left: 0, width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{theme}</Box>}
                sx={{
                  position: "relative",
                  m: 0,
                  width: 44,
                  height: 44,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  cursor: "pointer",
                  "&:focus-within": { outline: "3px solid", outlineColor: "primary.main", outlineOffset: 1 },
                  "&::before": {
                    content: '""',
                    width: { xs: 30, sm: 34 },
                    height: { xs: 30, sm: 34 },
                    borderRadius: "50%",
                    border: "1px solid",
                    borderColor: tokens.border,
                    background: `linear-gradient(135deg, ${tokens.canvas} 0%, ${tokens.surface} 45%, ${tokens.primary} 100%)`,
                    boxShadow: selected ? `0 0 0 2px ${tokens.canvas}, 0 0 0 4px ${tokens.focus}` : "none",
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </RadioGroup>
      <Typography variant="caption" sx={{ fontWeight: 700, mt: 0.5 }} aria-hidden="true">
        {value}{value === "Aurora" ? " · Default" : ""}
      </Typography>
      <FormHelperText sx={{ mx: 0 }}>
        Changes the app’s look only. Your aura colors and entries stay the same.
      </FormHelperText>
    </FormControl>
  );
}
