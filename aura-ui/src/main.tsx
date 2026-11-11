// src/main.tsx (or index.tsx)
import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

import { Box, CircularProgress, CssBaseline } from "@mui/material";
import { ThemeProvider, THEME_ID as MATERIAL_THEME_ID } from "@mui/material/styles";
import { CssVarsProvider as JoyCssVarsProvider } from "@mui/joy/styles";
import {
  getAuraJoyTheme,
  getAuraTheme,
  interfaceThemeTokens,
  resolveInterfaceTheme,
} from "./theme";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastProvider } from "./hooks/useToast";
import { useCurrentUserQuery } from "./store/hooks/useCurrentUserQuery";
import "./index.css";
import { useAppSelector } from "./store/hooks";
import { selectCurrentUser } from "./store/slices/authSlice";
import { selectInterfaceThemePreview } from "./store/slices/uiSlice";
import { normalizeAuraIntensity, resolveAuraColor } from "./theme/auraTheme";
import { AuraTokensStyle } from "./components/aura/AuraTokensStyle";

function ThemedApp() {
 
  const { isLoading } = useCurrentUserQuery();
  const user = useAppSelector(selectCurrentUser);
  const interfaceThemePreview = useAppSelector(selectInterfaceThemePreview);
  
  // Profile mutations update Redux immediately, making saved preferences visible across both themes.
  const auraColor = resolveAuraColor(user?.auraColor);
  const auraIntensity = normalizeAuraIntensity(user?.auraIntensity);
  // An unsaved profile choice previews across the app, then falls back to the saved account setting.
  const interfaceTheme = resolveInterfaceTheme(interfaceThemePreview ?? user?.interfaceTheme);
  const interfaceMode = interfaceThemeTokens[interfaceTheme].mode;

  const theme = useMemo(
    () => getAuraTheme(auraColor, auraIntensity, interfaceTheme),
    [auraColor, auraIntensity, interfaceTheme]
  );
  const joyTheme = useMemo(
    () => getAuraJoyTheme(interfaceTheme),
    [interfaceTheme],
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={{ [MATERIAL_THEME_ID]: theme }}>
      <JoyCssVarsProvider
        theme={joyTheme}
        defaultMode={interfaceMode}
        defaultColorScheme={interfaceMode}
        modeStorageKey={`aura-theme-mode-${interfaceTheme}`}
        colorSchemeStorageKey={`aura-theme-scheme-${interfaceTheme}`}
      >
        <CssBaseline enableColorScheme />
        {/* #344: derived aura accents; off when the user disabled aura reveals or is signed out. */}
        <AuraTokensStyle interfaceTheme={interfaceTheme} enabled={!!user && user.auraRevealsEnabled !== false} />
        <ToastProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <RouterProvider router={router} />
          </LocalizationProvider>
        </ToastProvider>
      </JoyCssVarsProvider>
    </ThemeProvider>
  );
}

const rootElement = document.getElementById("root")!;
createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  </StrictMode>
);
