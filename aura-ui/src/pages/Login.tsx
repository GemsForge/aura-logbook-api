import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/slices/authSlice";
import { AuthApi } from "../api/AuthApi";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const response = await AuthApi.login({ email, password });
      dispatch(loginSuccess({ token: response.token, email }));
      navigate("/dashboard");
    } catch (error: any) {
      setErrorMsg(error?.response?.data || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{ backgroundColor: "#f9f9f9" }}>
      <Paper elevation={4} sx={{ padding: 4, width: 400 }}>
        <Typography variant="h5" mb={2} textAlign="center">
          Sign In
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          {errorMsg && (
            <Typography color="error" variant="body2" mt={1}>
              {errorMsg}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </form>
        <Typography variant="body2" mt={2}>
          Don't have an account?{" "}
          <Link href="/register" underline="hover">
            Sign up
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginForm;
