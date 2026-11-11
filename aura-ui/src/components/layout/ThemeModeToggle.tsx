import { useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useUpdateUserMutation } from "@/store/authApi";
import { persistGuestInterfaceMode, selectInterfaceMode, setGuestInterfaceMode, setPendingInterfaceMode } from "@/store/slices/uiSlice";

/** One-click brightness control shared by the header and full-screen onboarding top bar.
 * Sends only required identity fields and mode; failed account saves discard only the pending mode.
 */
export function ThemeModeToggle() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const mode = useAppSelector(selectInterfaceMode);
  const pending = useAppSelector((state) => state.ui.pendingInterfaceMode);
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [error, setError] = useState("");
  const nextMode = mode === "dark" ? "light" : "dark";
  const label = `Switch to ${nextMode} theme`;
  const toggle = async () => {
    if (isLoading || pending) return;
    setError("");
    if (!user) {
      dispatch(setGuestInterfaceMode(nextMode));
      if (!persistGuestInterfaceMode(nextMode)) setError("Your browser could not save this preference. It applies for this visit.");
      return;
    }
    dispatch(setPendingInterfaceMode(nextMode));
    try {
      await updateUser({ id: user.id, email: user.email, displayName: user.displayName,
        selectedPathway: user.selectedPathway, interfaceMode: nextMode }).unwrap();
    } catch {
      setError("Could not save your screen mode. Your previous mode has been restored. Try again.");
    } finally { dispatch(setPendingInterfaceMode(null)); }
  };
  return <Box sx={{ position: "relative", flexShrink: 0 }}>
    <IconButton aria-label={label} title={label} onClick={() => void toggle()} disabled={isLoading || !!pending}
      sx={{ minWidth: 44, minHeight: 44, color: "text.primary", "&:focus-visible": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 2 } }}>
      {mode === "dark" ? <LightModeOutlined /> : <DarkModeOutlined />}
    </IconButton>
    {error && <Typography role="alert" sx={{ position: "absolute", right: 0, top: "100%", zIndex: 1400,
      width: "min(260px, calc(100vw - 32px))", p: 1.5, borderRadius: 1, bgcolor: "background.paper", color: "error.main",
      border: "1px solid var(--al-theme-control-border)", fontSize: "0.875rem" }}>{error}</Typography>}
  </Box>;
}
