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
      <Box sx={{ display: { xs: "none", md: "flex" }, flex: 1, flexDirection: "column", alignItems: "center", p: 7, maxWidth: 500 }}><Box aria-hidden="true" className="aura-orb" sx={{ width: 220, mb: 8 }} /><Typography level="h2" sx={{ fontSize: "3.3rem", fontWeight: 400, letterSpacing: "-.05em", lineHeight: 1.05 }}>Your world inside.<br />A little clearer.</Typography><Typography level="body-md" color="neutral" sx={{ mt: 2 }}>A quiet ritual. A more connected you.</Typography></Box>
      <Sheet variant="outlined" className="aura-panel" sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 440, flexShrink: 0, boxSizing: "border-box" }}>
        <Typography className="aura-eyebrow" color="neutral" sx={{ mb: 2 }}>Aura Logbook / Your own little universe</Typography>
        {!showTitle && <Typography level="h1" sx={{ fontSize: "3rem", fontWeight: 400, letterSpacing: "-.05em", lineHeight: 1, mb: 3 }}>Make yourself at home.</Typography>}
        {showTitle && (
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Typography level="h1" sx={{ fontSize: "3rem", fontWeight: 400, letterSpacing: "-0.05em", lineHeight: 1 }}>Welcome back · Sign in</Typography>
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
