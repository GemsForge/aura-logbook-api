import { resolveTemperatureUnit, resolveWeatherLocationMode } from "@/features/weather/weatherLocation";
import {
  type UpdateUserRequest,
} from "@/features/auth/models";
import {
  editProfileSchema,
  type EditProfileFormData,
} from "@/features/auth/models/EditProfileSchema";
import { DEFAULT_INTERFACE_MODE } from "@/features/auth/models/InterfaceTheme";
import { resolveInterfaceTheme, resolveInterfaceMode } from "@/theme";
import { useToast } from "@/hooks/useToast";
import { useGetCurrentUserQuery, useUpdateUserMutation } from "@/store/authApi";
import { useAppDispatch } from "@/store/hooks";
import { closeProfileModal, setInterfaceThemePreview, setInterfaceModePreview } from "@/store/slices/uiSlice";
import {
  getAuraColorPreview,
  normalizeAuraIntensity,
  resolveAuraColor,
} from "@/theme/auraTheme";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, LinearProgress } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import EditProfileForm from "./EditProfile/EditProfileForm";
import { AuraModal } from "../ui/AuraModal";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EditProfileModal({
  open,
  onClose,
}: EditProfileModalProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  // 1) Unconditionally call your hooks at the top:
  const { data: user, isFetching: loadingUser } = useGetCurrentUserQuery();
  const { data: referenceData, isError: referenceDataError } = useGetReferenceDataQuery();
  const auraOptions = referenceData?.auras ?? [];
  const pathwayOptions = referenceData?.pathways ?? [];
  const [updateUser] = useUpdateUserMutation();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // 1️⃣ grab the whole form API
  const form = useForm<EditProfileFormData>({
    resolver: yupResolver(editProfileSchema, {}) as Resolver<EditProfileFormData>,
    defaultValues: {
      displayName: "",
      email: user?.email ?? "",
      birthday: "",
      auraColor: "",
      auraIntensity: 50,
      avatar: "",
      password: "",
      confirmPassword: "",
      motto: "",
      spiritualPathway: "",
      interfaceTheme: "Aurora",
      interfaceMode: DEFAULT_INTERFACE_MODE,
      weatherLocationMode: "Off",
      weatherCity: "",
      weatherRegion: "",
      weatherCountry: "",
      temperatureUnit: "F",
      auraRevealsEnabled: true,
      isChangingPassword: false,
    },
  });

  // 2️⃣ pull out only the helpers you need
  const { watch, setValue, reset } = form;

  // sync local checkbox state into the form so validation sees it immediately
  useEffect(() => {
    setValue("isChangingPassword", isChangingPassword, {
      shouldValidate: true,
    });
  }, [isChangingPassword, setValue]);

  useEffect(() => {
    if (open && user) {
      dispatch(setInterfaceThemePreview(null));
      dispatch(setInterfaceModePreview(null));
      form.reset({
        displayName: user.displayName || "",
        email: user.email || "",
        birthday: user.birthday
          ? dayjs(user.birthday).format("YYYY-MM-DD")
          : "",
        auraColor: resolveAuraColor(user.auraColor, auraOptions)?.key ?? auraOptions[0]?.key ?? "",
        auraIntensity: normalizeAuraIntensity(user.auraIntensity),
        avatar: user.avatar || "",
        password: "",
        confirmPassword: "",
        motto: user.motto || "",
        spiritualPathway: pathwayOptions.some((pathway) => pathway.key === user.selectedPathway)
          ? user.selectedPathway!
          : pathwayOptions[0]?.key ?? "",
        interfaceTheme: resolveInterfaceTheme(user.interfaceTheme),
        interfaceMode: resolveInterfaceMode(user.interfaceMode, user.interfaceTheme),
        weatherLocationMode: resolveWeatherLocationMode(user.weatherLocationMode),
        weatherCity: user.weatherCity ?? "",
        weatherRegion: user.weatherRegion ?? "",
        weatherCountry: user.weatherCountry ?? "",
        temperatureUnit: resolveTemperatureUnit(user.temperatureUnit),
        auraRevealsEnabled: user.auraRevealsEnabled !== false,
      });
      setIsChangingPassword(false);
    } else if (!open) {
      dispatch(setInterfaceThemePreview(null));
      dispatch(setInterfaceModePreview(null));
    }
  }, [open, user, reset, form, dispatch, auraOptions, pathwayOptions]);

  if (referenceDataError) return <Box role="alert" sx={{ p: 2 }}>Profile definitions are unavailable. Please retry.</Box>;
  if (loadingUser || !user || !referenceData) return <LinearProgress color="secondary" aria-label="Loading profile definitions" />;

  const onSubmit = async (data: EditProfileFormData) => {
    const { auraIntensity, spiritualPathway, ...rest } = data;
    const payload: UpdateUserRequest = {
      id: user!.id,
      ...rest,
      auraIntensity: normalizeAuraIntensity(
        auraIntensity ?? user!.auraIntensity
      ),
      // Birthday is optional (#341): omit it when empty so the saved value is kept.
      birthday: data.birthday ? dayjs(data.birthday).format("YYYY-MM-DD") : undefined,
      password: isChangingPassword ? data.password : undefined,
      selectedPathway: spiritualPathway,
      // Only a typed place is sent; the API clears it for Off and Device (#331).
      weatherCity: data.weatherLocationMode === "City" ? data.weatherCity?.trim() : undefined,
      weatherRegion: data.weatherLocationMode === "City" ? data.weatherRegion?.trim() || undefined : undefined,
      weatherCountry: data.weatherLocationMode === "City" ? data.weatherCountry?.trim().toUpperCase() || undefined : undefined,
    };

    try {
      await updateUser(payload).unwrap(); // runs PUT /update
      dispatch(setInterfaceThemePreview(null));
      dispatch(setInterfaceModePreview(null));
      showToast("Profile updated!", "success");
      onClose(); // authApi invalidates “User” → refetches me
    } catch {
      showToast("Failed to update profile", "error");
    }
  };

  const colorKey = watch("auraColor");
  const intensity = watch("auraIntensity");
  const currentAuraBg = getAuraColorPreview(colorKey, intensity, auraOptions);
  // SHOULD I GET RID OF THIS DISPLAY NAME?
  const displayName = watch("displayName") || user?.displayName || "";
  const defaultInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AuraModal
      open={open}
      onClose={() => {
        dispatch(setInterfaceThemePreview(null));
      dispatch(setInterfaceModePreview(null));
        onClose();
      }}
      title={<span>Edit Profile</span>}
      size="lg"
      contentSx={{ p: 0, backgroundColor: "background.default", backgroundImage: "none" }}
    >
        <EditProfileForm
          form={form}
          isChangingPassword={isChangingPassword}
          onIsChangingPasswordChange={setIsChangingPassword}
          avatarPickerOpen={avatarPickerOpen}
          onAvatarPickerOpenChange={setAvatarPickerOpen}
          currentAuraBg={currentAuraBg}
          avatars={referenceData.graphics.filter((asset) => asset.assetType === "avatar")}
          defaultInitials={defaultInitials}
          onSubmit={onSubmit}
          onCancel={() => dispatch(closeProfileModal())}
          onModePreviewChange={(mode) => dispatch(setInterfaceModePreview(mode))}
          onThemePreviewChange={(theme) => dispatch(setInterfaceThemePreview(theme))}
        />
    </AuraModal>
  );
}
