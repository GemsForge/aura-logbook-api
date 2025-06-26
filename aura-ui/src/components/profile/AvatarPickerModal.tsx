import type { PresetAvatar } from "@/assets/presetAvatars";
import {
  Box,
  Typography,
  Grid,
  Avatar as MuiAvatar,
  Button,
  Tab,
  Tabs,
  TextField,
  Modal,
} from "@mui/material";
import { useState } from "react";

interface AvatarPickerModalProps {
  open: boolean;
  onClose: () => void;
  avatars: PresetAvatar[];
  userInitials: string;
  onSelect: (value: string) => void;
  auraBg: string;
}

export function AvatarPickerModal({
  open,
  onClose,
  avatars,
  userInitials,
  onSelect,
  auraBg,
}: AvatarPickerModalProps) {
  const [tab, setTab] = useState<"image" | "initials">("image");
  const [initials, setInitials] = useState(userInitials);

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
        <Typography variant="subtitle2" gutterBottom>
          Pick a profile picture
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          centered
          sx={{ mb: 2 }}>
          <Tab label="Image" value="image" />
          <Tab label="Initials" value="initials" />
        </Tabs>

        {tab === "image" ? (
          <Grid container spacing={2}>
            {avatars.map((img) => (
              <Grid sx={{ xs: 3 }} key={img.url}>
                <MuiAvatar
                  src={img.url}
                  sx={{ width: 60, height: 60, cursor: "pointer" }}
                  onClick={() => {
                    onSelect(img.url);
                    onClose();
                  }}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center" }}>
            <TextField
              value={initials}
              onChange={(e) =>
                setInitials(e.target.value.toUpperCase().slice(0, 3))
              }
              label="Initials"
              placeholder="AB"
              inputProps={{ maxLength: 3 }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <MuiAvatar
                sx={{
                  bgcolor: auraBg,
                  width: 72,
                  height: 72,
                  mx: "auto",
                }}>
                {initials}
              </MuiAvatar>
            </Box>

            <Button
              variant="contained"
              disabled={!initials}
              onClick={() => {
                onSelect(initials);
                onClose();
              }}>
              Select Initials
            </Button>
          </Box>
        )}
      </Box>
    </Modal>
  );
}
