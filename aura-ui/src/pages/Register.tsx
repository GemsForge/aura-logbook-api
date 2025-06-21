import { Box, Button, TextField, Typography, Link, Paper, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema, type RegisterFormValues } from "../features/auth/models/RegisterSchema";
import { AuthApi } from "../api/AuthApi";
import { useToast } from "../hooks/useToast";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useState } from "react";
import type { RegisterRequest } from "@/features/auth/models";

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
    resolver: yupResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormValues) => {
    const payload: RegisterRequest = {
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      birthday: dayjs(data.birthday).format("YYYY-MM-DD"),

    };
    setLoading(true);
    try {
      await AuthApi.register(payload);
      showToast("Account successfully created!", "success");
      navigate("/login");
    } catch (err: any) {
      const message = err.response?.data || "Registration failed";
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
        <Typography variant="h5" mb={2}>
          Create an Account
        </Typography>
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

          <Controller
            name="birthday"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Birthday"
                value={dayjs(field.value)}
                onChange={(newDate) => newDate && field.onChange(newDate)}
                format="MM-DD-YYYY"
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Register"}
          </Button>
        </form>
        <Typography variant="body2" mt={2}>
          Already have an account?{" "}
          <Link href="/login" underline="hover">
            Login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
