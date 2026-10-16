import type { MoodEntry } from "@/features/mood/models/schema";
import {
  Button,
  Typography,
} from "@mui/material";
import { AuraModal } from "./ui/AuraModal";


export default function DeleteConfirmDialog({
  onClose,
  onConfirm,
}: {
  entry: MoodEntry;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AuraModal
      open
      onClose={onClose}
      title="Confirm Deletion"
      size="sm"
      color="danger"
      variant="outlined"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} color="error" variant="contained">
            Delete
          </Button>
        </>
      }>
        <Typography>
          Are you sure you want to delete this mood entry? This action cannot be
          undone.
        </Typography>
    </AuraModal>
  );
}
