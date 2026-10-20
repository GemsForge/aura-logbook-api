import {
  SpiritualPathway,
  type UpdateUserRequest,
} from "@/features/auth/models";
import {
  editProfileSchema,
  type EditProfileFormData,
} from "@/features/auth/models/EditProfileSchema";
import { AuraColor } from "@/features/mood/models/aura";
import { useToast } from "@/hooks/useToast";
import { useGetCurrentUserQuery, useUpdateUserMutation } from "@/store/authApi";
import { useAppDispatch } from "@/store/hooks";
import { closeProfileModal } from "@/store/slices/uiSlice";
import { getAuraColorPreview, resolveAuraColor } from "@/theme/auraTheme";
import { yupResolver } from "@hookform/resolvers/yup";
import { LinearProgress } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import EditProfileForm from "./EditProfile/EditProfileForm";
import { AuraModal } from "../ui/AuraModal";

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
      auraColor: AuraColor.Blue,
      auraIntensity: 500,
      avatar: "",
      password: "",
      confirmPassword: "",
      motto: "",
      spiritualPathway: SpiritualPathway.Mindfulness,
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
      form.reset({
        displayName: user.displayName || "",
        email: user.email || "",
        birthday: user.birthday
          ? dayjs(user.birthday).format("YYYY-MM-DD")
          : "",
        auraColor: resolveAuraColor(user.auraColor),
        auraIntensity: user.auraIntensity ?? 500,
        avatar: user.avatar || "",
        password: "",
        confirmPassword: "",
        motto: user.motto || "",
        spiritualPathway: user.selectedPathway ?? SpiritualPathway.Mindfulness,
      });
      setIsChangingPassword(false);
    }
  }, [open, user, reset, form]);

  if (loadingUser || !user) return <LinearProgress color="secondary" />;

  const onSubmit = async (data: EditProfileFormData) => {
    const { auraIntensity, spiritualPathway, ...rest } = data;
    const payload: UpdateUserRequest = {
      id: user!.id,
      ...rest,
      auraIntensity: auraIntensity ?? user!.auraIntensity ?? 500,
      birthday: dayjs(data.birthday).format("YYYY-MM-DD"),
      password: isChangingPassword ? data.password : undefined,
      selectedPathway: spiritualPathway,
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
  const intensity = watch("auraIntensity");
  const currentAuraBg = getAuraColorPreview(colorKey, intensity);
  // SHOULD I GET RID OF THIS DISPLAY NAME?
  const displayName = watch("displayName") || user?.displayName || "";
  const defaultInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AuraModal open={open} onClose={onClose} title="Edit Profile" size="lg">
        <EditProfileForm
          form={form}
          isChangingPassword={isChangingPassword}
          onIsChangingPasswordChange={setIsChangingPassword}
          avatarPickerOpen={avatarPickerOpen}
          onAvatarPickerOpenChange={setAvatarPickerOpen}
          currentAuraBg={currentAuraBg}
          defaultInitials={defaultInitials}
          onSubmit={onSubmit}
          onCancel={() => dispatch(closeProfileModal())}
        />
    </AuraModal>
  );
}
