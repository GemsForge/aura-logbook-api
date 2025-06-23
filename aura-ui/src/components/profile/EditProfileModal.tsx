import { AuthApi } from "@/api/AuthApi";
import type { UpdateUserRequest } from "@/features/auth/models";
import { type EditProfileFormData, editProfileSchema } from "@/features/auth/models/EditProfileSchema";
import { useToast } from "@/hooks/useToast";
import { setUserProfile } from "@/store/slices/authSlice";
import {
    closeProfileModal,
    selectIsProfileModalOpen,
} from "@/store/slices/uiSlice";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Button, Modal, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

export default function EditProfileModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsProfileModalOpen);
  const { showToast } = useToast();
  const { displayName, birthday, userEmail } = useSelector(
    (state: any) => state.auth
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      birthday: "",
    },
  });
  

  // ⏪ Reset form each time modal opens with current user data
  useEffect(() => {
    if (isOpen) {
      reset({
        email: userEmail || "",
        displayName: displayName || "",
        birthday: birthday ? dayjs(birthday).format() : undefined,
        password: "",
      });
    }
  }, [isOpen, displayName, birthday, userEmail, reset]);
  
  const onSubmit = async (data: EditProfileFormData) => {
    const payload: UpdateUserRequest = {
      ...data,
      id: 0,
      birthday: dayjs(data.birthday).format("YYYY-MM-DD"),
    };
    try {
      await AuthApi.updateUser(payload);
      const updatedProfile = await AuthApi.getCurrentUser();
      dispatch(setUserProfile(updatedProfile));

      dispatch(closeProfileModal());
      showToast("Profile updated!", "success");
    } catch (err) {
      showToast("Failed to update profile", "error");
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => dispatch(closeProfileModal())}
      disableEscapeKeyDown={false}>
      <Box
        sx={{
          p: 4,
          width: 400,
          mx: "auto",
          mt: "10%",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
        }}>
        <Typography variant="h6" mb={2}>
          Edit Profile
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Display Name"
            margin="normal"
            {...register("displayName")}
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
          />
          <TextField
            fullWidth
            label="Email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            margin="normal"
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

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => dispatch(closeProfileModal())}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Save Changes
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
}
