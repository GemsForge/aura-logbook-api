import type { PresetAvatar } from "@/assets/presetAvatars";
import {
    Box,
    Grid,
    Avatar as MuiAvatar,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import { useState } from "react";
import { AuraModal } from "../ui/AuraModal";
import { AuraButton as Button } from "../ui/AuraButton";
import { AuraInput as TextField } from "../ui/AuraInput";

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
    <AuraModal open={open} onClose={onClose} title="Select an Avatar" size="sm">
      <Box sx={{ py: 1 }}>
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
              <Grid sx={{ xs: 3 }} key={img.name}>
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
    </AuraModal>
  );
}
