// src/pages/LoginForm.tsx
import { hydrateUserSession } from "@/api/hydrateUserSession";
import { useAppDispatch } from "@/store/hooks";
import { yupResolver } from "@hookform/resolvers/yup";
import Box from "@mui/joy/Box";
import CircularProgress from "@mui/joy/CircularProgress";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { AuraInput as TextField } from "@/components/ui/AuraInput";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "../api/AuthApi";
import {
  loginSchema,
  type LoginFormData,
} from "../features/auth/models/LoginSchema";
import { useToast } from "../hooks/useToast";
import { ForgotPasswordModal } from "@/components/profile/EditProfile/ForgetPasswordModal";

interface LoginFormProps {
  showTitle?: boolean;
}
export function LoginForm({ showTitle }: LoginFormProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

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
      const { token } = await AuthApi.login(data);

      const user = await hydrateUserSession(token, dispatch);

      if (!user) {
        showToast("Session hydration failed", "error");
        return;
      }

      showToast("Login successful!", "success");
      navigate("/dashboard");
    } catch {
      const message = "Login failed. Please try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "min(680px, calc(100vh - 150px))",
        px: { xs: 0, sm: 2 },
      }}
    >
      <Sheet variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, width: "100%", maxWidth: 440, borderRadius: "lg", boxShadow: "lg", backgroundColor: "background.surface" }}>
        {showTitle && (
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Typography level="h1" sx={{ fontSize: "2.2rem", letterSpacing: "-0.04em" }}>Welcome back · Sign in</Typography>
            <Typography level="body-sm" color="neutral" sx={{ mt: 0.75 }}>A small pause can change the shape of a day.</Typography>
          </Box>
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
            sx={{ mt: 2, minHeight: 48 }}
            disabled={loading}>
            {loading ? <CircularProgress size="md" /> : "Login"}
          </Button>
        </form>

        <Button
          variant="text"
          size="small"
          onClick={() => setForgotPasswordOpen(true)}
          sx={{ mt: 1, textTransform: "none", color: "neutral.600" }}>
          Forgot password?
        </Button>

        <Typography level="body-sm" sx={{ mt: 2 }}>
          Don’t have an account?{" "}
          <Link href="/register" underline="hover">
            Sign up
          </Link>
        </Typography>
      </Sheet>
      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </Box>
  );
}
