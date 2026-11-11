// Step 2 of account recovery (#329): choose a new password from the emailed link.
import { yupResolver } from "@hookform/resolvers/yup";
import Box from "@mui/joy/Box";
import CircularProgress from "@mui/joy/CircularProgress";
import Link from "@mui/joy/Link";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { AuraInput as TextField } from "@/components/ui/AuraInput";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { AuthApi } from "../api/AuthApi";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../features/auth/models/PasswordResetSchema";

/** Shown for missing, altered, expired, or already-used tokens; the API does not distinguish them. */
export const INVALID_RESET_LINK =
  "This reset link is invalid or has expired. Please request a new one.";

/**
 * Reads `?token=` and submits it with a new + confirm password (8–72, matching registration).
 * The token is only sent to the API; it is never stored client-side.
 */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : INVALID_RESET_LINK);
  const successRef = useRef<HTMLParagraphElement>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
  });

  const onSubmit = async ({ password }: ResetPasswordFormData) => {
    setLoading(true);
    setError(null);
    try {
      await AuthApi.resetPassword(token, password);
      setDone(true);
    } catch (e) {
      const res = (e as { response?: { status?: number; data?: unknown } }).response;
      setError(res?.status === 429
        ? "Too many attempts. Please wait a few minutes and try again."
        : typeof res?.data === "string" ? res.data : INVALID_RESET_LINK);
    } finally {
      setLoading(false);
    }
  };

  // Move keyboard focus to the success message when it replaces the focused submit button.
  useEffect(() => {
    if (done) successRef.current?.focus();
  }, [done]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "min(680px, calc(100vh - 150px))", px: { xs: 0, sm: 2 } }}>
      <Sheet variant="outlined" className="aura-panel" sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 440, boxSizing: "border-box" }}>
        <Typography level="h1" sx={{ fontSize: "2.4rem", fontWeight: 400, letterSpacing: "-.04em", mb: 1 }}>Choose a new password</Typography>
        {done ? (
          <Typography
            ref={successRef}
            role="status"
            tabIndex={-1}
            level="body-md"
            sx={{ mt: 2, "&:focus": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 3 } }}>
            Your password has been reset. <Link href="/login" underline="hover">Sign in</Link>
          </Typography>
        ) : (
          <>
            {error && <Typography role="alert" color="danger" level="body-sm" sx={{ mb: 1 }}>{error}</Typography>}
            {token ? (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <TextField label="New password" type="password" fullWidth margin="normal" {...register("password")}
                  error={!!errors.password} helperText={errors.password?.message} />
                <TextField label="Confirm new password" type="password" fullWidth margin="normal" {...register("confirmPassword")}
                  error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
                {/* Keep the disabled action named when its visible label becomes a spinner. */}
                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, minHeight: 48 }} disabled={loading} aria-label={loading ? "Resetting password" : undefined}>
                  {loading ? <CircularProgress size="md" /> : "Reset password"}
                </Button>
              </form>
            ) : null}
            <Typography level="body-sm" sx={{ mt: 2 }}>
              <Link href="/forgot-password" underline="hover">Request a new link</Link>
            </Typography>
          </>
        )}
      </Sheet>
    </Box>
  );
}
