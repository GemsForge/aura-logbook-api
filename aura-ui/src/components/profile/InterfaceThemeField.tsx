import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
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

/** Offers clear, keyboard-selectable previews for the saved application theme. */
export function InterfaceThemeField({ value, mode = "dark", onChange }: InterfaceThemeFieldProps) {
  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend" id="interface-theme-label">
        Interface theme
      </FormLabel>
      <RadioGroup
        aria-labelledby="interface-theme-label"
        name="interfaceTheme"
        value={value}
        onChange={(event) => onChange(event.target.value as InterfaceTheme)}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" },
          gap: 1,
          mt: 1,
        }}>
        {interfaceThemes.map((theme) => {
          const tokens = getInterfaceThemeTokens(theme, mode);
          const selected = value === theme;
          return (
            <FormControlLabel
              key={theme}
              value={theme}
              control={<Radio size="small" sx={{ position: "absolute", opacity: 0, width: 1, height: 1 }} />}
              label={
                <Box sx={{ width: "100%", minWidth: 0 }}>
                  <Box
                    aria-hidden="true"
                    sx={{
                      height: 42,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: tokens.border,
                      background: `linear-gradient(110deg, ${tokens.canvas} 0%, ${tokens.surface} 54%, ${tokens.primary} 100%)`,
                      boxShadow: selected ? `0 0 0 2px ${tokens.focus}, 0 5px 18px ${tokens.glow}` : "none",
                    }}
                  />
                  <Typography component="span" variant="caption" sx={{ display: "block", mt: 0.75, fontWeight: selected ? 700 : 500 }}>
                    {theme}{theme === "Aurora" ? " · Default" : ""}
                  </Typography>
                </Box>
              }
              sx={{
                position: "relative",
                minWidth: 0,
                m: 0,
                p: 1,
                alignItems: "stretch",
                border: "1px solid",
                borderColor: selected ? "primary.main" : "divider",
                borderRadius: 2,
                bgcolor: selected ? "action.selected" : "background.paper",
                cursor: "pointer",
                "&:focus-within": { outline: "3px solid", outlineColor: "primary.main", outlineOffset: 2 },
                "& .MuiFormControlLabel-label": { width: "100%" },
              }}
            />
          );
        })}
      </RadioGroup>
      <FormHelperText>
        Changes the app’s appearance only; your recorded aura colors and journal entries stay as they are.
      </FormHelperText>
    </FormControl>
  );
}
