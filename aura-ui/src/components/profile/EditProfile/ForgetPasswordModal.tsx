import { AuthApi } from "@/api/AuthApi";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/features/auth/models/ForgotPasswordFormData";
import { useToast } from "@/hooks/useToast";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  CircularProgress,
  Typography,
} from "@mui/material";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { AuraInput as TextField } from "@/components/ui/AuraInput";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { AuraModal } from "../../ui/AuraModal";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({
  open,
  onClose,
}: ForgotPasswordModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema, {}) as Resolver<ForgotPasswordFormData>,
    defaultValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await AuthApi.resetPassword(data.email, data.newPassword);

      showToast("Password updated successfully!", "success");
      reset();
      onClose();
    } catch (error: unknown) {
      const response =
        typeof error === "object" && error !== null && "response" in error
          ? error.response
          : undefined;
      const data =
        typeof response === "object" && response !== null && "data" in response
          ? response.data
          : undefined;
      const message =
        typeof data === "object" && data !== null && "message" in data &&
        typeof data.message === "string"
          ? data.message
          : "Failed to reset password. Please try again.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AuraModal
      open={open}
      onClose={handleClose}
      title="Reset Password"
      size="md"
      contentSx={{ display: "flex", flexDirection: "column", gap: 2 }}
      actionsSx={{ p: 2, gap: 1 }}
      actions={
        <>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </>
      }>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Enter your email and create a new password.
        </Typography>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={loading}
          />

          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            {...register("newPassword")}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
            disabled={loading}
          />

          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            {...register("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            disabled={loading}
          />
        </form>
    </AuraModal>
  );
}
