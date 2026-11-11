// src/main.tsx (or index.tsx)
import { StrictMode, useLayoutEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

import { Box, Button, CircularProgress, CssBaseline } from "@mui/material";
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
import { normalizeAuraIntensity } from "./theme/auraTheme";
import { AuraTokensStyle } from "./components/aura/AuraTokensStyle";
import { useGetReferenceDataQuery } from "./store/referenceDataApi";
import { hasUsableReferenceData } from "./theme/referenceDataValidation";
import { installThemeTokenVariables } from "./theme";

function ThemedApp() {
  const { data: referenceData, isLoading: referenceDataLoading, isError: referenceDataError, refetch } = useGetReferenceDataQuery();
  const { isLoading } = useCurrentUserQuery();
  const user = useAppSelector(selectCurrentUser);
  const interfaceThemePreview = useAppSelector(selectInterfaceThemePreview);
  
  // Profile mutations update Redux immediately, making saved preferences visible across both themes.
  const auraColor = user?.auraColor ?? referenceData?.auras[0]?.key ?? "blue";
  const auraIntensity = normalizeAuraIntensity(user?.auraIntensity);
  // An unsaved profile choice previews across the app, then falls back to the saved account setting.
  const interfaceTheme = resolveInterfaceTheme(interfaceThemePreview ?? user?.interfaceTheme);
  const interfaceMode = interfaceThemeTokens[interfaceTheme].mode;

  useLayoutEffect(() => {
    if (referenceData) installThemeTokenVariables(referenceData.themeTokens, referenceData.auras);
  }, [referenceData]);
  const referenceDataValid = referenceData ? hasUsableReferenceData(referenceData) : false;

  const theme = useMemo(
    () => getAuraTheme(auraColor, auraIntensity, interfaceTheme),
    [auraColor, auraIntensity, interfaceTheme]
  );
  const joyTheme = useMemo(
    () => getAuraJoyTheme(interfaceTheme),
    [interfaceTheme],
  );

  if (referenceDataLoading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (referenceDataError || !referenceData || !referenceDataValid) {
    return (
      <Box role="alert" sx={{ maxWidth: 560, mx: "auto", mt: 8, p: 3, textAlign: "center" }}>
        Aura Logbook could not load its current definitions. Please retry.
        <Button onClick={() => void refetch()} sx={{ display: "block", mx: "auto", mt: 2 }}>Retry</Button>
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
