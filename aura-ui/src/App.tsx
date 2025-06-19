import { Box, CircularProgress, Typography } from "@mui/material";
// import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { loginSuccess, logout } from "./store/slices/authSlice";
import { useToast } from "./hooks/useToast";
import { AuthApi } from "./api/AuthApi";

const DummyPage = () => (
  <Box p={2}>
    <h1>AuraLogbook UI</h1>
    <Typography variant="h4">This is a test page inside AppLayout</Typography>
  </Box>
);

function App() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const user = await AuthApi.getCurrentUser(); // uses token via interceptor
        dispatch(loginSuccess({ token, email: user.email }));
        showToast("Welcome back!", "info");
      } catch (err) {
        dispatch(logout());
        showToast("Session expired. Please log in again.", "warning");
      } finally {
        setCheckingAuth(false);
      }
    };

    restoreSession();
  }, [dispatch, showToast]);

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

export default App;
