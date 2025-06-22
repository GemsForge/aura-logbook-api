import { Box, CircularProgress, Typography } from "@mui/material";
// import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { logout } from "./store/slices/authSlice";
import { useToast } from "./hooks/useToast";
import { hydrateUserSession } from "./api/hydrateUserSession";

const DummyPage = () => (
  <Box p={2}>
    <h1>AuraLogbook UI</h1>
    <Typography variant="h4">This is a test page inside AppLayout</Typography>
  </Box>
);

export function App() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      const sessionHydrated =
        localStorage.getItem("session_hydrated") === "true";
      console.debug(sessionHydrated);

      // 👇 Skip if user just logged in (handled elsewhere)
      if (!token || sessionHydrated) {
        setCheckingAuth(false);
        return;
      }

      const user = await hydrateUserSession(token, dispatch);
      if (!user) {
        dispatch(logout());
        showToast("Session expired. Please log in again.", "warning");
      } else {
        showToast("Welcome back!", "info");
      }

      setCheckingAuth(false);
    };

    restoreSession();
  }, []);

  // Optional cleanup: remove hydration flag after short delay
  useEffect(() => {
    if (localStorage.getItem("session_hydrated") === "true") {
      setTimeout(() => {
        localStorage.removeItem("session_hydrated");
      }, 2000); // enough time to hydrate before allowing next session check
    }
  }, []);

  if (checkingAuth) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh">
        <CircularProgress size={40} />
      </Box>
    );
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DummyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

