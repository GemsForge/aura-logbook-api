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
import { passwordResetEnabled } from "../features/auth/models/PasswordResetSchema";

interface LoginFormProps {
  showTitle?: boolean;
}
export function LoginForm({ showTitle }: LoginFormProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
      {/* Keep the reflection message prominent with the orb, apart from sign-in actions. */}
      <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", alignItems: "center", width: 300, flexShrink: 0, mr: { md: 6, lg: 10 } }}>
        <Box aria-hidden="true" className="aura-orb" sx={{ width: 220, mb: 5 }} />
        <Typography level="h3" sx={{ maxWidth: 320, fontSize: { md: "1.8rem", lg: "2rem" }, fontWeight: 400, letterSpacing: "-0.035em", lineHeight: 1.2, textAlign: "center" }}>A journal for what you feel and believe.</Typography>
      </Box>
      <Sheet variant="outlined" className="aura-panel" sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 440, flexShrink: 0, boxSizing: "border-box" }}>
        <Box sx={{ mb: 3, textAlign: showTitle ? "center" : "left" }}>
          <Typography level="h1" sx={{ fontSize: { xs: "2.5rem", sm: "3rem" }, fontWeight: 400, letterSpacing: "-0.05em", lineHeight: 1 }}>Welcome back</Typography>
        </Box>

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

        {/* Token-based recovery (#329); hidden wherever the API has no email sender. */}
        {passwordResetEnabled && (
          <Typography level="body-sm" sx={{ mt: 2 }}>
            <Link href="/forgot-password" underline="hover">Forgot password?</Link>
          </Typography>
        )}

        <Typography level="body-sm" sx={{ mt: 2 }}>
          Don’t have an account?{" "}
          <Link href="/register" underline="hover">
            Sign up
          </Link>
        </Typography>
      </Sheet>
    </Box>
  );
}
