import { AuthApi } from "@/api/AuthApi";
import { presetAvatars } from "@/assets/presetAvatars";
import type { UpdateUserRequest, UserProfile } from "@/features/auth/models";
import {
  editProfileSchema,
  type EditProfileFormData,
} from "@/features/auth/models/EditProfileSchema";
import { AuraColor } from "@/features/mood/models/aura";
import { useToast } from "@/hooks/useToast";
import { useAppDispatch } from "@/store/hooks";
import { selectCurrentUser, setUserProfile } from "@/store/slices/authSlice";
import { closeProfileModal } from "@/store/slices/uiSlice";
import { auraPalettes, type ShadeKey } from "@/theme/auraTheme";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Modal,
  Avatar as MuiAvatar,
  Select,
  Slider,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { useSelector } from "react-redux";
import { AvatarPickerModal } from "./AvatarPickerModal";
import { MottoField } from "./MottoField";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ open, onClose }: Props) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const user: UserProfile = useSelector(selectCurrentUser)!;
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const resolver = yupResolver(editProfileSchema, {
    context: { isChangingPassword },
  }) as Resolver<EditProfileFormData, any>;

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver,
    defaultValues: {
      displayName: user.displayName || "",
      email: user.email || "",
      birthday: user.birthday ? dayjs(user.birthday).format("YYYY-MM-DD") : "",
      auraColor: user.auraColor || AuraColor.Blue,
      auraIntensity: user.auraIntensity ?? 500,
      avatar: user.avatar || "",
      password: "",
      confirmPassword: "",
      motto: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
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
      await AuthApi.updateUser(payload);
      const updatedProfile = await AuthApi.getCurrentUser();
      dispatch(setUserProfile(updatedProfile));
      showToast("Profile updated!", "success");
      onClose();
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

          {/* Aura Color */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* color preview */}
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: currentAuraBg,
                border: "1px solid",
                borderColor: "grey.400",
              }}
            />
            <FormControl fullWidth>
              <InputLabel id="aura-color-label">Aura Color</InputLabel>
              <Controller
                name="auraColor"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="aura-color-label"
                    label="Aura Color"
                    fullWidth>
                    {Object.values(AuraColor).map((c) => (
                      <MenuItem key={c} value={c}>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            width: 12,
                            height: 12,
                            backgroundColor: auraPalettes[c].primary!.main,
                            borderRadius: "50%",
                            mr: 1,
                            verticalAlign: "middle",
                          }}
                        />
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Box>

          {/* Intensity Slider */}
          <Controller
            name="auraIntensity"
            control={control}
            render={({ field }) => (
              <Box>
                <Typography gutterBottom>Intensity</Typography>
                <Slider
                  min={100}
                  max={900}
                  step={100}
                  value={field.value ?? 500}
                  onChange={(_, value) => field.onChange(value as number)}
                  onBlur={field.onBlur}
                  valueLabelDisplay="auto"
                  sx={{
                    "& .MuiSlider-thumb": { color: theme.palette.primary.main },
                    "& .MuiSlider-track": { color: theme.palette.primary.main },
                  }}
                />
              </Box>
            )}
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
