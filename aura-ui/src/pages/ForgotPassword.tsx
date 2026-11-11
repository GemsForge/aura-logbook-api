// Step 1 of account recovery (#329): request an emailed reset link.
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
import { AuthApi } from "../api/AuthApi";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../features/auth/models/PasswordResetSchema";

/** Generic confirmation; never reveals whether the email has an account. */
export const FORGOT_PASSWORD_CONFIRMATION =
  "If an account exists for that email, a reset link has been sent. Check your inbox.";

/**
 * Email-only request form. Every completed request (and any network error short of a rate limit)
 * shows the same confirmation so the page cannot be used to discover registered emails.
 */
export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<HTMLParagraphElement>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    setLoading(true);
    setError(null);
    try {
      await AuthApi.forgotPassword(email);
      setSent(true);
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status;
      setError(status === 429
        ? "Too many requests. Please wait a few minutes and try again."
        : "We couldn't send a reset link right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Move keyboard focus to the confirmation when success replaces the focused submit button.
  useEffect(() => {
    if (sent) confirmationRef.current?.focus();
  }, [sent]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "min(680px, calc(100vh - 150px))", px: { xs: 0, sm: 2 } }}>
      <Sheet variant="outlined" className="aura-panel" sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 440, boxSizing: "border-box" }}>
        <Typography level="h1" sx={{ fontSize: "2.4rem", fontWeight: 400, letterSpacing: "-.04em", mb: 1 }}>Forgot password</Typography>
        {sent ? (
          <Typography
            ref={confirmationRef}
            role="status"
            tabIndex={-1}
            level="body-md"
            sx={{ mt: 2, "&:focus": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 3 } }}>
            {FORGOT_PASSWORD_CONFIRMATION}
          </Typography>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography level="body-sm" color="neutral">Enter your email and we'll send you a link to choose a new password.</Typography>
            <TextField label="Email" type="email" fullWidth margin="normal" {...register("email")}
              error={!!errors.email} helperText={errors.email?.message} />
            {error && <Typography role="alert" color="danger" level="body-sm">{error}</Typography>}
            {/* Keep the disabled action named when its visible label becomes a spinner. */}
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2, minHeight: 48 }} disabled={loading} aria-label={loading ? "Sending reset link" : undefined}>
              {loading ? <CircularProgress size="md" /> : "Send reset link"}
            </Button>
          </form>
        )}
        <Typography level="body-sm" sx={{ mt: 2 }}>
          <Link href="/login" underline="hover">Back to sign in</Link>
        </Typography>
      </Sheet>
    </Box>
  );
}
