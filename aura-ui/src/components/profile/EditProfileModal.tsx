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
import { auraPalettes, type ShadeKey } from "@/theme/auraTheme";
import { yupResolver } from "@hookform/resolvers/yup";
import { Box, LinearProgress } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import AuraModal from "../ui/modal/AuraModal";
import EditProfileForm from "./EditProfile/EditProfileForm";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

// export default function EditProfileModal({
//   open,
//   onClose,
// }: EditProfileModalProps) {
//   const controller = useEditProfileModalController(open, onClose);

//   if (controller.loadingUser || !controller.user)
//     return <LinearProgress color="secondary" />;

//   return (
//     <Modal open={open} onClose={onClose} disableEscapeKeyDown={false}>
//       <Box
//         sx={{
//           position: "absolute",
//           top: "50%",
//           left: "50%",
//           transform: "translate(-50%, -50%)",
//           width: { xs: "90%", sm: 600 },
//           maxWidth: 800,
//           p: 4,
//           bgcolor: "background.paper",
//           borderRadius: 2,
//           boxShadow: 24,
//         }}>
//         <EditProfileModalBody {...controller} />
//       </Box>
//     </Modal>
//   );
// }

export default function AuraEditProfileModal({
  open,
  onClose,
}: EditProfileModalProps) {
  const controller = useEditProfileModalController(open, onClose);

  if (controller.loadingUser || !controller.user)
    return <LinearProgress color="secondary" />;

  return (
    <AuraModal
      title="Edit Profile"
      open={open}
      onClose={onClose}
      layout="center"
      color="primary"
      size="sm"
      variant="plain"
      overflow="scrollable">
      <EditProfileModalBody {...controller} />
    </AuraModal>
  );
}

interface EditProfileModalBodyProps {
  form: UseFormReturn<EditProfileFormData>;
  isChangingPassword: boolean;
  setIsChangingPassword: Dispatch<SetStateAction<boolean>>;
  avatarPickerOpen: boolean;
  setAvatarPickerOpen: Dispatch<SetStateAction<boolean>>;
  currentAuraBg: string;
  defaultInitials: string;
  onSubmit: (data: EditProfileFormData) => Promise<void>;
  onCancel: () => void;
}

function EditProfileModalBody({
  form,
  isChangingPassword,
  setIsChangingPassword,
  avatarPickerOpen,
  setAvatarPickerOpen,
  currentAuraBg,
  defaultInitials,
  onSubmit,
  onCancel,
}: EditProfileModalBodyProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      <EditProfileForm
        form={form}
        isChangingPassword={isChangingPassword}
        onIsChangingPasswordChange={setIsChangingPassword}
        avatarPickerOpen={avatarPickerOpen}
        onAvatarPickerOpenChange={setAvatarPickerOpen}
        currentAuraBg={currentAuraBg}
        defaultInitials={defaultInitials}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </Box>
  );
}

function useEditProfileModalController(open: boolean, onClose: () => void) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  // 1) Unconditionally call your hooks at the top:
  const { data: user, isFetching: loadingUser } = useGetCurrentUserQuery();
  const [updateUser] = useUpdateUserMutation();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // 1️⃣ grab the whole form API
  const form = useForm<EditProfileFormData>({
    resolver: yupResolver(editProfileSchema, {}) as Resolver<
      EditProfileFormData,
      any
    >,
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
        spiritualPathway: user.selectedPathway ?? SpiritualPathway.Mindfulness,
      });
      setIsChangingPassword(false);
    }
  }, [open, user, reset]);

  const onSubmit = async (data: EditProfileFormData) => {
    if (!user) return;
    const { auraIntensity, spiritualPathway, ...rest } = data;
    const payload: UpdateUserRequest = {
      id: user.id,
      ...rest,
      auraIntensity: auraIntensity ?? user.auraIntensity ?? 500,
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
  const intensity = (watch("auraIntensity") ?? 500) as ShadeKey;

  // now grab the shade at that intensity
  const currentAuraBg =
    auraPalettes[colorKey][intensity].main ??
    // fallback to primary if something’s missing
    auraPalettes[colorKey].primary.main;
  // SHOULD I GET RID OF THIS DISPLAY NAME?
  const displayName = watch("displayName") || user?.displayName || "";
  const defaultInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    user,
    loadingUser,
    form,
    isChangingPassword,
    setIsChangingPassword,
    avatarPickerOpen,
    setAvatarPickerOpen,
    currentAuraBg,
    defaultInitials,
    onSubmit,
    onCancel: () => dispatch(closeProfileModal()),
  };
}
