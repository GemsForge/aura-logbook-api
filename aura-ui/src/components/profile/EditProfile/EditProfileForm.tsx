import {
  Box,
  Checkbox,
  FormControlLabel,
  Avatar as MuiAvatar,
  Typography,
} from "@mui/material";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { AuraInput as TextField } from "@/components/ui/AuraInput";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, type UseFormReturn } from "react-hook-form";
import { presetAvatars } from "@/assets/presetAvatars";
import { MyPathwaySelector } from "@/components/MyPathwaySelector";
import { AuraSelector } from "../AuraSelectorField";
import { AvatarPickerModal } from "../AvatarPickerModal";
import { MottoField } from "../MottoField";
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
      sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.82fr 1.4fr" }, gap: { xs: 2, md: 3 }, p: { xs: 2, sm: 3 }, backgroundColor: "#F7F2EA" }}>
      {/* The modal opens with identity and avatar controls so the form feels like profile editing, not a settings dump. */}
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
                alignItems: "center",
                gap: 2,
                p: 2,
                borderRadius: "16px",
                background: "linear-gradient(135deg, #F4E7DF 0%, #FFFCF7 100%)",
                border: "1px solid #D9CEC0",
                alignSelf: "start",
                flexDirection: { xs: "row", md: "column" },
                gridColumn: { xs: "1", md: "1" },
              }}>
              <MuiAvatar
                src={isImage ? val : undefined}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: !isImage ? currentAuraBg : undefined,
                }}>
                {!isImage ? val : null}
              </MuiAvatar>
              <Box sx={{ textAlign: { md: "center" } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#352D2C" }}>Your profile image</Typography>
                <Typography variant="body2" sx={{ color: "#665D56", mb: 0.75 }}>Choose the image that represents your space.</Typography>
                <Button variant="outlined" size="small" onClick={() => onAvatarPickerOpenChange(true)}>Change avatar</Button>
              </Box>
              {errors.avatar && (
                <Typography color="error">{errors.avatar.message}</Typography>
              )}
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(217,206,192,.8)", display: { xs: "none", md: "block" } }}>
                <Typography variant="caption" sx={{ color: "#665D56", display: "block" }}>Current aura</Typography>
                <Box sx={{ height: 36, mt: 0.75, borderRadius: 2, background: currentAuraBg, border: "1px solid rgba(53,45,44,.12)" }} />
              </Box>
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

      <Box sx={{ gridColumn: { xs: "1", md: "2" }, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography variant="overline" sx={{ letterSpacing: "0.16em", color: "#665D56" }}>About you</Typography>
        <Typography variant="body2" sx={{ color: "#665D56", mb: 1 }}>A few details help make your logbook feel personal.</Typography>
      </Box>

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
      <MyPathwaySelector
        control={control}
        errorMessage={errors.spiritualPathway?.message}
      />

      <MottoField control={control} name="motto" />

      <Box sx={{ pt: 1 }}>
        <Typography variant="overline" sx={{ letterSpacing: "0.16em", color: "#665D56" }}>Your aura</Typography>
        <Typography variant="body2" sx={{ color: "#665D56", mb: 1 }}>Choose the colors and intensity that feel like you today.</Typography>
      </Box>

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
      </Box>

      <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", gap: 1.5, mt: 1, pt: 2, borderTop: "1px solid #D9CEC0" }}>
        <Button variant="plain" color="neutral" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" type="submit" sx={{ minWidth: 150 }}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
export default EditProfileForm;
