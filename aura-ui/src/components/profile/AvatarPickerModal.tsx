import type { PresetAvatar } from "@/assets/presetAvatars";
import {
  Modal,
  Box,
  Typography,
  Grid,
  Avatar as MuiAvatar,
} from "@mui/material";

interface AvatarPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  avatars: PresetAvatar[];
}

export default function AvatarPickerModal({
  open,
  onClose,
  onSelect,
  avatars,
}: AvatarPickerModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 360,
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
        }}>
        <Typography variant="subtitle1" gutterBottom>
          Select an Avatar
        </Typography>
        <Grid container spacing={2}>
          {avatars.map((avatar) => (
            <Grid key={avatar.name} sx={{xs:2}}>
              <MuiAvatar
                src={avatar.url}
                sx={{ width: 60, height: 60, cursor: "pointer" }}
                onClick={() => {
                  onSelect(avatar.url);
                  onClose();
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Modal>
  );
}
