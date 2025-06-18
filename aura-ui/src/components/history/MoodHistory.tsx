import { useEffect, useState } from "react";
import { MoodApi } from "../../api/MoodApi";

import { MoodCard } from "./MoodCard";
import { Box, Typography } from "@mui/material";
import type { MoodEntry } from "../../features/mood/models/MoodEntry";
import MoodUpdateModal from "../MoodUpdateModal";
import DeleteConfirmDialog from "../DeleteConfirmDialog";

export default function MoodHistoryPage() {
  const [logs, setLogs] = useState<MoodEntry[]>([]);
  const [entryToEdit, setEntryToEdit] = useState<MoodEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<MoodEntry | null>(null);

  const fetchLogs = async () => {
    const res = await MoodApi.getAllMoods();
    setLogs(res);
  };

  useEffect(() => {
    fetchLogs();
  }, []);
  //TODO: Add filtering by tags and date
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
          onConfirm={async () => {
            await MoodApi.deleteMood(entryToDelete.id);
            setEntryToDelete(null);
            fetchLogs();
          }}
        />
      )}
    </Box>
  );
}
