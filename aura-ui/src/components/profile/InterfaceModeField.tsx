import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { interfaceModePreferences, type InterfaceModePreference } from "@/features/auth/models/InterfaceTheme";

/**
 * Profile brightness choice as a compact Light/Dark/System segmented control; theme family,
 * aura color, and intensity remain separate fields. Deselecting is ignored so a mode
 * is always set.
 */
export function InterfaceModeField({ value, onChange }: { value: InterfaceModePreference; onChange: (mode: InterfaceModePreference) => void }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
      <Typography id="interface-mode-label" variant="body2" sx={{ color: "text.secondary" }}>Screen mode</Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        aria-labelledby="interface-mode-label"
        onChange={(_, mode: InterfaceModePreference | null) => { if (mode) onChange(mode); }}>
        {interfaceModePreferences.map((mode) => (
          <ToggleButton key={mode} value={mode} title={mode === "system" ? "Use device setting" : undefined} sx={{ px: 2, minHeight: 36, textTransform: "none" }}>
            {mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
