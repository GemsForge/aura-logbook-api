import { MyPathwaySelector } from "@/components/MyPathwaySelector";
import { SpiritualPathway, type RegisterRequest } from "@/features/auth/models";
import { yupResolver } from "@hookform/resolvers/yup";
import Box from "@mui/joy/Box";
import CircularProgress from "@mui/joy/CircularProgress";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { AuraInput as TextField } from "@/components/ui/AuraInput";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "../api/AuthApi";
import { registerSchema, type RegisterFormValues } from "../features/auth/models/RegisterSchema";
import { useToast } from "../hooks/useToast";

export default function RegisterForm() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      spiritualPathway: SpiritualPathway.Mindfulness,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    const payload: RegisterRequest = {
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      birthday: dayjs(data.birthday).format("YYYY-MM-DD"),
      selectedPathway: data.spiritualPathway,
    };
    setLoading(true);
    try {
      await AuthApi.register(payload);
      showToast("Account successfully created!", "success");
      navigate("/login");
    } catch (err: unknown) {
      const response = typeof err === "object" && err !== null && "response" in err
        ? (err as { response?: { data?: unknown } }).response
        : undefined;
      const message = typeof response?.data === "string" ? response.data : "Registration failed";
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
        minHeight: "min(760px, calc(100vh - 150px))",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        px: { xs: 0, sm: 2 },
        py: 2,
      }}
    >
      <Sheet
        variant="outlined"
        className="aura-panel"
        sx={{
          p: { xs: 2, sm: 4 },
          width: "100%",
          maxWidth: 720,
          minWidth: 0,
          boxSizing: "border-box",
          borderRadius: "lg",
          boxShadow: "lg",
          backgroundColor: "background.surface",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography className="aura-eyebrow" color="neutral" sx={{ mb: 2 }}>A little space that’s all yours</Typography>
          <Typography level="h1" className="aura-page-heading">Begin your logbook</Typography>
          <Typography level="body-sm" color="neutral" sx={{ mt: 0.75 }}>Make space for the moments that matter.</Typography>
        </Box>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            margin="normal"
            {...register("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
          <TextField
            fullWidth
            label="Display Name"
            margin="normal"
            {...register("displayName")}
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
          />

          {/* Spiritual Pathways Field */}
          <MyPathwaySelector
            control={control}
            errorMessage={errors.spiritualPathway?.message}
          />

          <Controller
            name="birthday"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Birthday"
                value={field.value ? dayjs(field.value) : null}
                onChange={(newDate) => field.onChange(newDate?.isValid() ? newDate.format("YYYY-MM-DD") : "")}
                slotProps={{ textField: {
                  onBlur: field.onBlur,
                  error: !!errors.birthday,
                  helperText: errors.birthday?.message,
                } }}
                format="MM-DD-YYYY"
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2, minHeight: 48 }}
            disabled={loading}>
            {loading ? <CircularProgress size="md" /> : "Register"}
          </Button>
        </form>
        <Typography level="body-sm" sx={{ mt: 2 }}>
          Already have an account?{" "}
          <Link href="/login" underline="hover">
            Login
          </Link>
        </Typography>
      </Sheet>
    </Box>
  );
}
