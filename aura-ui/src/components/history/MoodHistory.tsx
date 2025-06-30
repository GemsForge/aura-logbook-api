import type { MoodEntry } from "@/features/mood/models/schema";
import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { MoodApi } from "../../api/MoodApi";
import { useToast } from "../../hooks/useToast";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import MoodUpdateModal from "../MoodUpdateModal";
import { MoodCard } from "./MoodCard";
import type { Dayjs } from "dayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export default function MoodHistoryPage() {
  const [logs, setLogs] = useState<MoodEntry[]>([]);
  // filter state
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [entryToEdit, setEntryToEdit] = useState<MoodEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<MoodEntry | null>(null);

  const { showToast } = useToast();

  const fetchLogs = async (start?: Dayjs | null, end?: Dayjs | null) => {
    try {
      // pass date or undefined

      const res = await MoodApi.getAllMoods(
        start ? start.format("LL") : undefined,
        end ? end.format("LL") : undefined
      );
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
    fetchLogs(null, null);
  }, []);

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>
        Mood History
      </Typography>

      {/* ─── date filter UI ─────────────────────────────────────────── */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box display="flex" gap={2} mb={2}>
          <DatePicker
            label="Start date"
            value={startDate}
            onChange={setStartDate}
            disableFuture
            format="YYYY-MM-DD"
          />
          <DatePicker
            label="End date"
            value={endDate}
            onChange={setEndDate}
            disableFuture
            minDate={startDate ?? undefined}
            format="YYYY-MM-DD"
          />
          <Button
            variant="contained"
            onClick={() => fetchLogs(startDate, endDate)}>
            Filter
          </Button>
        </Box>
      </LocalizationProvider>

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
