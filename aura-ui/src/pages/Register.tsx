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
import { PasswordField } from "@/components/ui/PasswordField";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "../api/AuthApi";
import {
  registerSchema,
  type RegisterFormValues,
} from "../features/auth/models/RegisterSchema";
import { useToast } from "../hooks/useToast";

/** Collects account details and creates a new private Aura Logbook account. */
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
      // Toast echoes the button's language ("Start my logbook") so the flow reads as one voice.
      showToast("Your logbook is ready. Log in to begin.", "success");
      navigate("/login");
    } catch (err: unknown) {
      const response =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { data?: unknown } }).response
          : undefined;
      // Distinguish a server that cannot be reached from an API rejection.
      const message = !response
        ? "We couldn't reach the server. Please try again."
        : typeof response.data === "string"
          ? response.data
          : "Registration failed";
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
      }}>
      <Sheet
        variant="outlined"
        className="aura-panel"
        sx={{
          p: { xs: 2, sm: 3 }, // tighter than before (was sm: 4)
          width: "100%",
          maxWidth: 640, // narrower card suits a two-column form (was 720)
          minWidth: 0,
          boxSizing: "border-box",
          borderRadius: "lg",
          boxShadow: "lg",
          backgroundColor: "background.surface",
        }}>
        <Box sx={{ mb: 2 }}>
          {/* Eyebrow removed: it repeated what the heading and subline already say. */}
          {/* Heading stays an h1 for accessibility; fontSize is set directly so it can't balloon. */}
          <Typography
            level="h1"
            className="aura-page-heading"
            sx={{ fontSize: "clamp(1.5rem, 1.2rem + 1vw, 2rem)" }}>
            Begin your logbook
          </Typography>
          <Typography level="body-sm" color="neutral" sx={{ mt: 0.5 }}>
            Make space for the moments that matter.
          </Typography>
        </Box>

        {/* CSS grid: two columns on sm+, one on phones. `gap` replaces margin="normal". */}
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}>
          <TextField
            label="Email"
            autoComplete="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Display name"
            autoComplete="nickname"
            {...register("displayName")}
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
          />
          <PasswordField
            label="Password"
            autoComplete="new-password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Controller
            name="birthday"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Birthday"
                value={field.value ? dayjs(field.value) : null}
                onChange={(newDate) =>
                  field.onChange(
                    newDate?.isValid() ? newDate.format("YYYY-MM-DD") : "",
                  )
                }
                slotProps={{
                  textField: {
                    fullWidth: true, // fixes the orphaned half-width box
                    onBlur: field.onBlur,
                    error: !!errors.birthday,
                    helperText: errors.birthday?.message,
                  },
                }}
                format="MM-DD-YYYY"
              />
            )}
          />

          {/* Spans both columns. Chips live inside MyPathwaySelector. */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <MyPathwaySelector
              control={control}
              errorMessage={errors.spiritualPathway?.message}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            sx={{ gridColumn: "1 / -1", minHeight: 48, mt: 0.5 }}
            disabled={loading}>
            {loading ? <CircularProgress size="md" /> : "Start my logbook"}
          </Button>
        </Box>

        <Typography level="body-sm" sx={{ mt: 1.5 }}>
          Already have an account?{" "}
          <Link href="/login" underline="hover">
            Log in
          </Link>
        </Typography>
      </Sheet>
    </Box>
  );
}
