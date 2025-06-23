import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { yupResolver } from "@hookform/resolvers/yup";
import { AuthApi } from "@/api/AuthApi";
import { setUserProfile } from "@/store/slices/authSlice";
import {
  closeProfileModal,
  selectIsProfileModalOpen,
} from "@/store/slices/uiSlice";
import { useToast } from "@/hooks/useToast";
import {
  type EditProfileFormData,
  editProfileSchema,
} from "@/features/auth/models/EditProfileSchema";
import type { UpdateUserRequest } from "@/features/auth/models";

export default function EditProfileModal() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsProfileModalOpen);
  const { showToast } = useToast();
  const { displayName, birthday, userEmail } = useSelector(
    (state: any) => state.auth
  );
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: yupResolver(editProfileSchema, {
      context: { isChangingPassword },
    }),
    defaultValues: {
      email: "",
      displayName: "",
      birthday: "",
      password: undefined,
      confirmPassword: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        email: userEmail || "",
        displayName: displayName || "",
        birthday: birthday ? dayjs(birthday).format() : undefined,
        password: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    }
  }, [isOpen, displayName, birthday, userEmail, reset]);

  const onSubmit = async (data: EditProfileFormData) => {
    const {confirmPassword, ...rest} = data;
    const payload: UpdateUserRequest = {
      ...rest,
      id: 0,
      birthday: dayjs(data.birthday).format("YYYY-MM-DD"),
      password: isChangingPassword ? data.password : undefined,
    };
    try {
      await AuthApi.updateUser(payload);
      const updatedProfile = await AuthApi.getCurrentUser();
      dispatch(setUserProfile(updatedProfile));
      dispatch(closeProfileModal());
      showToast("Profile updated!", "success");
    } catch {
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
            margin="normal"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
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
          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox
                checked={isChangingPassword}
                onChange={(e) => setIsChangingPassword(e.target.checked)}
              />
            }
            label="Change password?"
          />
          {isChangingPassword && (
            <>
              <TextField
                fullWidth
                label="New Password"
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
            </>
          )}

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
