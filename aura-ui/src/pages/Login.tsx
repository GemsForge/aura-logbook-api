// src/pages/LoginForm.tsx
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
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  loginSchema,
  type LoginFormData,
} from "../features/auth/models/LoginSchema";
import { loginSuccess } from "../store/slices/authSlice";
import { AuthApi } from "../api/AuthApi";
import { useToast } from "../hooks/useToast";
import { useState } from "react";
import { hydrateUserSession } from "@/api/hydrateUserSession";

interface LoginFormProps {
  showTitle?: boolean;
}
export function LoginForm({ showTitle }: LoginFormProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const {token} = await AuthApi.login(data);
      
    const user = await hydrateUserSession(token, dispatch);
     
      user ?
      dispatch(loginSuccess({ token: token, email: user.email })) : showToast("User is null");

      showToast("Login successful!", "success");
      navigate("/dashboard");
    } catch (error: any) {
      const message =
       "Login failed. Please try again.";
      showToast(message, "error");
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
        {showTitle && (
          <Typography variant="h5" mb={2} textAlign="center">
            Sign In
          </Typography>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

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
          Don’t have an account?{" "}
          <Link href="/register" underline="hover">
            Sign up
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
