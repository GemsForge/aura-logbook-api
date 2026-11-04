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
import { getAuraJoyTheme, getAuraTheme } from "./theme";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastProvider } from "./hooks/useToast";
import { useCurrentUserQuery } from "./store/hooks/useCurrentUserQuery";
import "./index.css";
import { useAppSelector } from "./store/hooks";
import { selectCurrentUser } from "./store/slices/authSlice";
import { normalizeAuraIntensity, resolveAuraColor } from "./theme/auraTheme";

function ThemedApp() {
 
  const { isLoading } = useCurrentUserQuery();
  const user = useAppSelector(selectCurrentUser);
  
  // Profile mutations update Redux immediately, making saved preferences visible across both themes.
  const auraColor = resolveAuraColor(user?.auraColor);
  const auraIntensity = normalizeAuraIntensity(user?.auraIntensity);

  const theme = useMemo(
    () => getAuraTheme(auraColor, auraIntensity),
    [auraColor, auraIntensity]
  );
  const joyTheme = useMemo(
    () => getAuraJoyTheme(auraColor, auraIntensity),
    [auraColor, auraIntensity],
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
      <JoyCssVarsProvider theme={joyTheme}>
        <CssBaseline enableColorScheme />
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
