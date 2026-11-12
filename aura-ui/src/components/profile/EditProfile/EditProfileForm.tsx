import { useState } from "react";
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
  Avatar as MuiAvatar,
  Typography,
} from "@mui/material";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { AuraInput as TextField } from "@/components/ui/AuraInput";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { Controller, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { ProfileSections, type ProfileSection } from "./ProfileSections";
import type { GraphicAsset } from "@/store/referenceDataApi";
import { MyPathwaySelector } from "@/components/MyPathwaySelector";
import { AvatarPickerModal } from "../AvatarPickerModal";
import { MottoField } from "../MottoField";
import { InterfaceModeField } from "../InterfaceModeField";
import { InterfaceThemeField } from "../InterfaceThemeField";
import { WeatherLocationField } from "../WeatherLocationField";
import type { InterfaceTheme, InterfaceModePreference } from "@/features/auth/models/InterfaceTheme";
import type { EditProfileFormData } from "@/features/auth/models/EditProfileSchema";

interface EditProfileFormProps {
  form: UseFormReturn<EditProfileFormData>;
  isChangingPassword: boolean;
  onIsChangingPasswordChange: (value: boolean) => void;
  avatarPickerOpen: boolean;
  onAvatarPickerOpenChange: (value: boolean) => void;
  currentAuraBg: string;
  defaultInitials: string;
  avatars: GraphicAsset[];
  onSubmit: (data: EditProfileFormData) => Promise<void>;
  onCancel: () => void;
  /** Live previews preserve all aura and family fields until Save or Cancel. */
  onModePreviewChange: (mode: InterfaceModePreference) => void;
  onThemePreviewChange: (theme: InterfaceTheme) => void;
}

/** Maps each validated field to the section that renders it, for revealing errors on submit. */
const fieldSection: Partial<Record<keyof EditProfileFormData, string>> = {
  displayName: "profile", birthday: "profile", spiritualPathway: "profile", motto: "profile",
  interfaceTheme: "appearance", interfaceMode: "appearance",
  auraRevealsEnabled: "aura",
  weatherLocationMode: "weather", weatherCity: "weather", weatherRegion: "weather", weatherCountry: "weather", temperatureUnit: "weather",
  email: "account", password: "account", confirmPassword: "account", isChangingPassword: "account",
};

/** Edit Profile form: compact identity header, responsive sections, and a sticky save bar. */
export function EditProfileForm({
  form,
  isChangingPassword,
  onIsChangingPasswordChange,
  avatarPickerOpen,
  onAvatarPickerOpenChange,
  currentAuraBg,
  defaultInitials,
  avatars,
  onSubmit,
  onCancel,
  onThemePreviewChange,
  onModePreviewChange,
}: EditProfileFormProps) {
  const {
    register,
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = form;

  // Bumped on each failed submit so ProfileSections reveals the section holding the first error.
  const [reveal, setReveal] = useState<{ id: string; nonce: number }>();

  const avatarValue = watch("avatar") || "";
  const avatarIsImage = avatars.some((asset) => asset.path === avatarValue);

  const sections: ProfileSection[] = [
    {
      id: "profile",
      title: "Profile",
      content: (
        <>
          <TextField label="Display Name" {...register("displayName")} error={!!errors.displayName} helperText={errors.displayName?.message} fullWidth />
          <Controller
            name="birthday"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Birthday"
                // An empty birthday (allowed since #341) shows a blank picker, not "Invalid Date".
                value={field.value ? dayjs(field.value) : null}
                onChange={(newDate) => newDate && field.onChange(newDate)}
                format="MM-DD-YYYY"
                slotProps={{ textField: { fullWidth: true } }}
              />
            )}
          />
          <MyPathwaySelector control={control} errorMessage={errors.spiritualPathway?.message} />
          <MottoField control={control} name="motto" />
        </>
      ),
    },
    {
      id: "appearance",
      title: "Appearance",
      content: (
        <>
          <Controller name="interfaceMode" control={control} render={({ field }) => (
            <InterfaceModeField value={field.value} onChange={(mode) => { field.onChange(mode); onModePreviewChange(mode); }} />
          )} />
          <Controller
            name="interfaceTheme"
            control={control}
            render={({ field }) => (
              <InterfaceThemeField
                value={field.value}
                mode={watch("interfaceMode")}
                onChange={(theme) => { field.onChange(theme); onThemePreviewChange(theme); }}
              />
            )}
          />
        </>
      ),
    },
    {
      id: "aura",
      title: "Aura",
      content: (
        <>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Your reflected color shifts with your recent mood check-ins. The interface theme is a separate preference.
          </Typography>
          {/* #344: aura reveals can be turned off; accents then fall back to the interface theme. */}
          <Controller
            name="auraRevealsEnabled"
            control={control}
            render={({ field }) => (
              <FormControl>
                <FormControlLabel
                  control={<Switch checked={field.value !== false} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="Aura reveals"
                  aria-describedby="aura-reveals-help"
                />
                <FormHelperText id="aura-reveals-help" sx={{ mx: 0 }}>Tint your space with your aura and show what shaped it.</FormHelperText>
              </FormControl>
            )}
          />
        </>
      ),
    },
    {
      id: "weather",
      title: "Weather",
      content: <WeatherLocationField control={control} setValue={setValue} errors={errors} />,
    },
    {
      id: "account",
      title: "Account and security",
      content: (
        <>
          <TextField label="Email" type="email" {...register("email")} error={!!errors.email} helperText={errors.email?.message} fullWidth />
          <FormControlLabel
            control={<Checkbox checked={isChangingPassword} onChange={() => onIsChangingPasswordChange(!isChangingPassword)} />}
            label="Change password?"
            sx={{ alignSelf: "flex-start" }}
          />
          {isChangingPassword && (
            <>
              <TextField fullWidth label="New Password" type="password" {...register("password")} error={!!errors.password} helperText={errors.password?.message} />
              <TextField fullWidth label="Confirm Password" type="password" {...register("confirmPassword")} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
            </>
          )}
        </>
      ),
    },
  ];

  const onInvalid = (invalid: FieldErrors<EditProfileFormData>) => {
    const firstField = Object.keys(invalid)[0] as keyof EditProfileFormData | undefined;
    const sectionId = firstField ? fieldSection[firstField] : undefined;
    if (sectionId) setReveal((prev) => ({ id: sectionId, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate sx={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: "100%" }}>
      {/* Compact identity row replaces the tall avatar card so fields start near the top on phones. */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: { xs: 2, sm: 3 }, py: 2, minWidth: 0 }}>
        <MuiAvatar src={avatarIsImage ? avatarValue : undefined} sx={{ width: 48, height: 48, bgcolor: !avatarIsImage ? currentAuraBg : undefined }}>
          {!avatarIsImage ? avatarValue || defaultInitials : null}
        </MuiAvatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>{watch("displayName") || "Your profile"}</Typography>
          <Button variant="plain" size="small" onClick={() => onAvatarPickerOpenChange(true)} sx={{ px: 0, minHeight: 0 }}>Change avatar</Button>
        </Box>
        {errors.avatar && <Typography color="error" variant="body2">{errors.avatar.message}</Typography>}
        <AvatarPickerModal
          open={avatarPickerOpen}
          onClose={() => onAvatarPickerOpenChange(false)}
          avatars={avatars}
          userInitials={defaultInitials}
          auraBg={currentAuraBg}
          onSelect={(val) => {
            setValue("avatar", val, { shouldValidate: true });
            onAvatarPickerOpenChange(false);
          }}
        />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, px: { xs: 0, md: 1 } }}>
        <ProfileSections sections={sections} defaultExpanded={["profile", "appearance"]} reveal={reveal} />
      </Box>

      {/* Sticky so Save stays reachable without scrolling to the end of a long form. */}
      <Box sx={{ position: "sticky", bottom: 0, zIndex: 1, display: "flex", justifyContent: "space-between", gap: 1.5, px: { xs: 2, sm: 3 }, py: 1.5, bgcolor: "background.default", borderTop: "1px solid var(--al-theme-border)" }}>
        <Button variant="plain" color="neutral" onClick={onCancel}>Cancel</Button>
        <Button variant="contained" type="submit" sx={{ minWidth: 140 }}>Save Changes</Button>
      </Box>
    </Box>
  );
}
export default EditProfileForm;
