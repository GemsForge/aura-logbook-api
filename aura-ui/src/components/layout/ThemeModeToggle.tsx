import { useId, useState } from "react";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import SettingsBrightnessOutlined from "@mui/icons-material/SettingsBrightnessOutlined";
import { interfaceModePreferences, type InterfaceModePreference } from "@/features/auth/models/InterfaceTheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useUpdateUserMutation } from "@/store/authApi";
import { persistGuestInterfaceMode, selectInterfaceModePreference, setGuestInterfaceMode, setPendingInterfaceMode } from "@/store/slices/uiSlice";

const labels = { light: "Light", dark: "Dark", system: "Use device setting" };
/** Shared three-way preference menu; device changes never rewrite the account preference. */
export function ThemeModeToggle({ disabled = false }: {
  /** Serialize appearance updates with onboarding completion. */
  disabled?: boolean;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const preference = useAppSelector(selectInterfaceModePreference);
  const pending = useAppSelector((state) => state.ui.pendingInterfaceMode);
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [error, setError] = useState("");
  const menuId = useId();
  const busy = disabled || isLoading || !!pending;
  const choose = async (value: InterfaceModePreference) => {
    if (busy) return;
    setAnchor(null);
    if (value === preference) return;
    setError("");
    if (!user) {
      dispatch(setGuestInterfaceMode(value));
      if (!persistGuestInterfaceMode(value)) setError("Your browser could not save this preference. It applies for this visit.");
      return;
    }
    dispatch(setPendingInterfaceMode(value));
    try {
      await updateUser({ id: user.id, email: user.email, displayName: user.displayName,
        interfaceMode: value }).unwrap();
    } catch {
      setError("Could not save your screen mode. Your previous mode has been restored. Try again.");
    } finally { dispatch(setPendingInterfaceMode(null)); }
  };
  return <Box sx={{ position: "relative", flexShrink: 0 }}>
    <IconButton aria-label="Screen mode" title={`Screen mode: ${labels[preference]}`} aria-haspopup="menu"
      aria-controls={anchor ? menuId : undefined} aria-expanded={!!anchor} onClick={(event) => setAnchor(event.currentTarget)} disabled={busy}
      sx={{ minWidth: 44, minHeight: 44, color: "text.primary", "&:focus-visible": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 2 } }}>
      {preference === "system" ? <SettingsBrightnessOutlined /> : preference === "dark" ? <DarkModeOutlined /> : <LightModeOutlined />}
    </IconButton>
    <Menu id={menuId} anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} slotProps={{ list: { "aria-label": "Screen mode" } }}>
      {interfaceModePreferences.map((value) => <MenuItem key={value} role="menuitemradio" aria-checked={preference === value}
        selected={preference === value} disabled={busy} onClick={() => void choose(value)}>{labels[value]}</MenuItem>)}
    </Menu>
    {error && <Typography role="alert" sx={{ position: "absolute", right: 0, top: "100%", zIndex: 1400,
      width: "min(260px, calc(100vw - 32px))", p: 1.5, borderRadius: 1, bgcolor: "background.paper", color: "error.main",
      border: "1px solid var(--al-theme-control-border)", fontSize: "0.875rem" }}>{error}</Typography>}
  </Box>;
}
