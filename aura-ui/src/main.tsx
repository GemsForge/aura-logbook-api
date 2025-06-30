// src/main.tsx (or index.tsx)
import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { getAuraTheme } from "./theme";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastProvider } from "./hooks/useToast";
import { useGetCurrentUserQuery } from "./store/authApi";

function ThemedApp() {
 
  const { data: user, isLoading } = useGetCurrentUserQuery();
  
  const auraColor     = user?.auraColor     ?? "blue";
 const auraIntensity = user?.auraIntensity ?? 500;

  const theme = useMemo(
    () => getAuraTheme(auraColor, auraIntensity),
    [auraColor, auraIntensity]
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <RouterProvider router={router} />
        </LocalizationProvider>
      </ToastProvider>
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
