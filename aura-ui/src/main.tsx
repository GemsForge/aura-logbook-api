// src/main.tsx (or index.tsx)
import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import { store } from "./store/store";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { getAuraTheme } from "./theme";
import { selectAuraColor, selectAuraIntensity } from "./store/slices/authSlice";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastProvider } from "./hooks/useToast";

function ThemedApp() {
  const auraColor = useSelector(selectAuraColor);
  const auraIntensity = useSelector(selectAuraIntensity);

  const theme = useMemo(
    () => getAuraTheme(auraColor, auraIntensity),
    [auraColor, auraIntensity]
  );

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
