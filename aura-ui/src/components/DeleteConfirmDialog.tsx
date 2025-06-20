import type { MoodEntry } from "@/features/mood/models/schema";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";


export default function DeleteConfirmDialog({
  onClose,
  onConfirm,
}: {
  entry: MoodEntry;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this mood entry? This action cannot be
          undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
