import { presetAvatars } from "@/assets/presetAvatars";
import type { UpdateUserRequest } from "@/features/auth/models";
import {
  editProfileSchema,
  type EditProfileFormData,
} from "@/features/auth/models/EditProfileSchema";
import { AuraColor } from "@/features/mood/models/aura";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch } from "@/store/hooks";
 import { 
   useGetCurrentUserQuery, 
   useUpdateUserMutation 
 } from "@/store/authApi";
import { closeProfileModal } from "@/store/slices/uiSlice";
import { auraPalettes, type ShadeKey } from "@/theme/auraTheme";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Modal,
  Avatar as MuiAvatar,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { AvatarPickerModal } from "./AvatarPickerModal";
import { MottoField } from "./MottoField";
import { AuraSelector } from "./AuraSelectorField";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ open, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  // 1) Unconditionally call your hooks at the top:
  const { data: user, isFetching: loadingUser } = useGetCurrentUserQuery();
  const [updateUser, ] = useUpdateUserMutation();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // 1️⃣ grab the whole form API
const form = useForm<EditProfileFormData>({
  resolver: yupResolver(editProfileSchema, {
    context: { isChangingPassword },
  }) as Resolver<EditProfileFormData, any>,
  defaultValues: {
    displayName:  "",
    email:        "",
    birthday:     "",
    auraColor:    AuraColor.Blue,
    auraIntensity:500,
    avatar:       "",
    password:     "",
    confirmPassword: "",
    motto:        "",
  },
});

// 2️⃣ pull out only the helpers you need
const {
  register,
  control,
  watch,
  setValue,
  handleSubmit,
  reset,
  formState: { errors },
} = form;

  useEffect(() => {
    if (open && user) {
      form.reset({
        displayName: user.displayName || "",
        email: user.email || "",
        birthday: user.birthday
          ? dayjs(user.birthday).format("YYYY-MM-DD")
          : "",
        auraColor: user.auraColor || AuraColor.Blue,
        auraIntensity: user.auraIntensity ?? 500,
        avatar: user.avatar || "",
        password: "",
        confirmPassword: "",
        motto: user.motto || "",
      });
      setIsChangingPassword(false);
    }
  }, [open, user, reset]);

  if (loadingUser || !user) return <Typography>Loading…</Typography>;
  
  const onSubmit = async (data: EditProfileFormData) => {
    const { auraIntensity, confirmPassword, ...rest } = data;
    const payload: UpdateUserRequest = {
      id: user.id,
      ...rest,
      auraIntensity: auraIntensity ?? user.auraIntensity ?? 500,
      birthday: dayjs(data.birthday).format("YYYY-MM-DD"),
      password: isChangingPassword ? data.password : undefined,
    };

    try {
      await updateUser(payload).unwrap(); // runs PUT /update
      showToast("Profile updated!", "success");
      onClose(); // authApi invalidates “User” → refetches me
    } catch {
      showToast("Failed to update profile", "error");
    }
  };

  const colorKey = watch("auraColor");
  const intensity = (watch("auraIntensity") ?? 500) as ShadeKey;

  // now grab the shade at that intensity
  const currentAuraBg =
    auraPalettes[colorKey][intensity].main ??
    // fallback to primary if something’s missing
    auraPalettes[colorKey].primary.main;
  const displayName = watch("displayName") || user.displayName || "";
  const defaultInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Modal open={open} onClose={onClose} disableEscapeKeyDown={false}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 600 },
          maxWidth: 800,
          p: 4,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
        }}>
        <Typography variant="h6" gutterBottom>
          Edit Profile
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Current Avatar & Change Button */}
          <Controller
            name="avatar"
            control={control}
            render={({ field }) => {
              const val = field.value || "";
              // is it one of our preset image URLs?
              const isImage = presetAvatars.some((a) => a.url === val);

              return (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}>
                  <MuiAvatar
                    // if it’s an image, give it as src; otherwise leave undefined so we fall back to initials
                    src={isImage ? val : undefined}
                    sx={{
                      width: 80,
                      height: 80,
                      // only color-fill the background when it’s initials
                      bgcolor: !isImage ? currentAuraBg : undefined,
                    }}>
                    {/* if it’s NOT an image, render the initials as the child */}
                    {!isImage ? val : null}
                  </MuiAvatar>
                  <Button
                    variant="text"
                    onClick={() => setAvatarPickerOpen(true)}>
                    Change Avatar
                  </Button>
                  {errors.avatar && (
                    <Typography color="error">
                      {errors.avatar.message}
                    </Typography>
                  )}
                  <AvatarPickerModal
                    open={avatarPickerOpen}
                    onClose={() => setAvatarPickerOpen(false)}
                    avatars={presetAvatars}
                    userInitials={defaultInitials}
                    auraBg={currentAuraBg}
                    onSelect={(val) => {
                      setValue("avatar", val, { shouldValidate: true });
                      setAvatarPickerOpen(false);
                    }}
                  />
                </Box>
              );
            }}
          />

          {/* Display Name */}
          <TextField
            label="Display Name"
            {...register("displayName")}
            error={!!errors.displayName}
            helperText={errors.displayName?.message}
            fullWidth
          />

          {/* Email */}
          <TextField
            label="Email"
            type="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
          />

          {/* Birthday */}
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
          <MottoField control={control} name="motto" />

          {/* Aura Color Selector and preview */}
          <AuraSelector
            control={control}
            colorField="auraColor"
            intensityField="auraIntensity"
          />

          {/* Change Password Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isChangingPassword}
                onChange={() => setIsChangingPassword((p) => !p)}
              />
            }
            label="Change password?"
            sx={{ alignSelf: "flex-start" }}
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
        </Box>
      </Box>
    </Modal>
  );
}
