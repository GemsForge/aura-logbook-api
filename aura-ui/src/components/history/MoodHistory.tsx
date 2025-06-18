import { useEffect, useState } from "react";
import { MoodApi } from "../../api/MoodApi";
import { MoodCard } from "./MoodCard";
import { Box, Typography } from "@mui/material";
import type { MoodEntry } from "../../features/mood/models/MoodEntry";
import MoodUpdateModal from "../MoodUpdateModal";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import { useToast } from "../../hooks/useToast";

export default function MoodHistoryPage() {
  const [logs, setLogs] = useState<MoodEntry[]>([]);
  const [entryToEdit, setEntryToEdit] = useState<MoodEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<MoodEntry | null>(null);

  const { showToast } = useToast(); 

  const fetchLogs = async () => {
    try {
      const res = await MoodApi.getAllMoods();
      setLogs(res);
    } catch (error: any) {
      showToast("Failed to load mood history", "error");
    }
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    try {
      await MoodApi.deleteMood(entryToDelete.id);
      showToast("Mood entry deleted", "success");
      setEntryToDelete(null);
      fetchLogs();
    } catch (error: any) {
      showToast("Failed to delete mood entry", "error");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>
        Mood History
      </Typography>

      {logs.map((entry, index) => (
        <MoodCard
          key={index}
          entry={entry}
          onEdit={setEntryToEdit}
          onDelete={setEntryToDelete}
        />
      ))}

      {entryToEdit && (
        <MoodUpdateModal
          entry={entryToEdit}
          onClose={() => setEntryToEdit(null)}
          onSuccess={fetchLogs}
        />
      )}

      {entryToDelete && (
        <DeleteConfirmDialog
          entry={entryToDelete}
          onClose={() => setEntryToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </Box>
  );
}
