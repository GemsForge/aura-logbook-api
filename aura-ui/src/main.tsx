// src/main.tsx (or index.tsx)
import { useSystemInterfaceMode } from "./hooks/useSystemInterfaceMode";
import { StrictMode, useLayoutEffect, useMemo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

import { Box, Button, CircularProgress, CssBaseline } from "@mui/material";
import { ThemeProvider, THEME_ID as MATERIAL_THEME_ID } from "@mui/material/styles";
import { CssVarsProvider as JoyCssVarsProvider, useColorScheme } from "@mui/joy/styles";
import {
  getAuraJoyTheme,
  getAuraTheme,
  type InterfaceMode,
} from "./theme";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastProvider } from "./hooks/useToast";
import { useCurrentUserQuery } from "./store/hooks/useCurrentUserQuery";
import "./index.css";
import { useAppSelector } from "./store/hooks";
import { selectCurrentUser } from "./store/slices/authSlice";
import { selectInterfaceTheme, selectInterfaceMode } from "./store/slices/uiSlice";
import { normalizeAuraIntensity } from "./theme/auraTheme";
import { AuraTokensStyle } from "./components/aura/AuraTokensStyle";
import { useGetReferenceDataQuery } from "./store/referenceDataApi";
import { hasUsableReferenceData } from "./theme/referenceDataValidation";
import { installThemeTokenVariables } from "./theme";
import SpotifyOAuthReturnPage from "./features/spotify/SpotifyOAuthReturnPage";
import { notifySpotifyOAuthOpener, readSpotifyOAuthResult } from "./features/spotify/spotifyOAuthCallback";

/** Redux keeps both UI libraries aligned; Joy’s render cache never overrides the account preference. */
function ModeBridge({ mode, children }: { mode: InterfaceMode; children: ReactNode }) {
  const { setMode } = useColorScheme();
  useLayoutEffect(() => { setMode(mode); }, [mode, setMode]);
  return children;
}

function ThemedApp() {
  useSystemInterfaceMode();
  const { data: referenceData, isLoading: referenceDataLoading, isError: referenceDataError, refetch } = useGetReferenceDataQuery();
  const { isLoading } = useCurrentUserQuery();
  const user = useAppSelector(selectCurrentUser);
  const interfaceTheme = useAppSelector(selectInterfaceTheme);
  
  // Profile mutations update Redux immediately, making saved preferences visible across both themes.
  const auraColor = user?.auraColor ?? referenceData?.auras[0]?.key ?? "blue";
  const auraIntensity = normalizeAuraIntensity(user?.auraIntensity);
  // Providers and banners share the same independent family and brightness selectors.
  const interfaceMode = useAppSelector(selectInterfaceMode);

  useLayoutEffect(() => {
    if (referenceData) installThemeTokenVariables(referenceData.themeTokens, referenceData.auras);
  }, [referenceData]);
  const referenceDataValid = referenceData ? hasUsableReferenceData(referenceData) : false;

  const theme = useMemo(
    () => getAuraTheme(auraColor, auraIntensity, interfaceTheme, interfaceMode),
    [auraColor, auraIntensity, interfaceTheme, interfaceMode]
  );
  const joyTheme = useMemo(
    () => getAuraJoyTheme(interfaceTheme, undefined, undefined, interfaceMode),
    [interfaceTheme, interfaceMode],
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
        defaultColorScheme={{ light: "light", dark: "dark" }}
        storageWindow={null}
        modeStorageKey="aura-joy-render-mode"
        colorSchemeStorageKey="aura-joy-render-scheme"
      >
        <ModeBridge mode={interfaceMode}>
        <CssBaseline enableColorScheme />
        {/* #344: derived aura accents; off when the user disabled aura reveals or is signed out. */}
        <AuraTokensStyle interfaceTheme={interfaceTheme} interfaceMode={interfaceMode} enabled={!!user && user.auraRevealsEnabled !== false} />
        <ToastProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <RouterProvider router={router} />
          </LocalizationProvider>
        </ToastProvider>
        </ModeBridge>
      </JoyCssVarsProvider>
    </ThemeProvider>
  );
}

const rootElement = document.getElementById("root")!;
const spotifyOAuthResult = readSpotifyOAuthResult(window.location.search);
const callbackReturnedToAura = spotifyOAuthResult
  ? notifySpotifyOAuthOpener(window.opener, window.location.origin, spotifyOAuthResult)
  : false;

if (callbackReturnedToAura) window.close();

createRoot(rootElement).render(
  spotifyOAuthResult && !callbackReturnedToAura && !localStorage.getItem("token")
    ? <SpotifyOAuthReturnPage result={spotifyOAuthResult} />
    : <StrictMode>
        <Provider store={store}>
          <ThemedApp />
        </Provider>
      </StrictMode>
);
