import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Avatar as MuiAvatar,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, type UseFormReturn } from "react-hook-form";
import { presetAvatars } from "@/assets/presetAvatars";
import { AuraSelector } from "../AuraSelectorField";
import { AvatarPickerModal } from "../AvatarPickerModal";
import { MottoField } from "../MottoField";
import { SpiritualPathwayField } from "../SpiritualPathwayField";
import type { EditProfileFormData } from "@/features/auth/models/EditProfileSchema";

interface EditProfileFormProps {
  form: UseFormReturn<EditProfileFormData>;
  isChangingPassword: boolean;
  onIsChangingPasswordChange: (value: boolean) => void;
  avatarPickerOpen: boolean;
  onAvatarPickerOpenChange: (value: boolean) => void;
  currentAuraBg: string;
  defaultInitials: string;
  onSubmit: (data: EditProfileFormData) => Promise<void>;
  onCancel: () => void;
}

export function EditProfileForm({
  form,
  isChangingPassword,
  onIsChangingPasswordChange,
  avatarPickerOpen,
  onAvatarPickerOpenChange,
  currentAuraBg,
  defaultInitials,
  onSubmit,
  onCancel,
}: EditProfileFormProps) {
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
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
                src={isImage ? val : undefined}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: !isImage ? currentAuraBg : undefined,
                }}>
                {!isImage ? val : null}
              </MuiAvatar>
              <Button
                variant="text"
                onClick={() => onAvatarPickerOpenChange(true)}>
                Change Avatar
              </Button>
              {errors.avatar && (
                <Typography color="error">{errors.avatar.message}</Typography>
              )}
              <AvatarPickerModal
                open={avatarPickerOpen}
                onClose={() => onAvatarPickerOpenChange(false)}
                avatars={presetAvatars}
                userInitials={defaultInitials}
                auraBg={currentAuraBg}
                onSelect={(val) => {
                  setValue("avatar", val, { shouldValidate: true });
                  onAvatarPickerOpenChange(false);
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

      {/* Spiritual Pathways Field */}
      <SpiritualPathwayField
        control={control}
        error={!!errors.spiritualPathways}
        helperText={errors.spiritualPathways?.message}
      />

      <MottoField control={control} name="motto" />

      {/* Aura Color Selector */}
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
            onChange={() => onIsChangingPasswordChange(!isChangingPassword)}
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
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" type="submit">
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
export default EditProfileForm;
