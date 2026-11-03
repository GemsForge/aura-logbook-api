import type { MoodEntry } from "@/features/mood/models/schema";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { MoodApi } from "../../api/MoodApi";
import { useToast } from "../../hooks/useToast";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import MoodUpdateModal from "../MoodUpdateModal";
import { MoodCard } from "./MoodCard";

/** Presents real journal entries with responsive date filters and explicit request states. */
export default function MoodHistoryPage() {
  const [logs, setLogs] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // filter state
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [entryToEdit, setEntryToEdit] = useState<MoodEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<MoodEntry | null>(null);

  const { showToast } = useToast();

  const fetchLogs = useCallback(
    async (start?: Dayjs | null, end?: Dayjs | null) => {
      setLoading(true);
      setFailed(false);
      try {
        const res = await MoodApi.getAllMoods(
          start ? start.format("YYYY-MM-DD") : undefined,
          end ? end.format("YYYY-MM-DD") : undefined,
        );
        setLogs(res);
      } catch {
        setFailed(true);
        showToast("Failed to load mood history", "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const handleDelete = async () => {
    if (!entryToDelete) return;
    try {
      await MoodApi.deleteMood(entryToDelete.id);
      showToast("Mood entry deleted", "success");
      setEntryToDelete(null);
      fetchLogs();
    } catch {
      showToast("Failed to delete mood entry", "error");
    }
  };

  useEffect(() => {
    fetchLogs(null, null);
  }, [fetchLogs]);

  return (
    <Box maxWidth={1000} mx="auto" mt={1}>
      <Typography className="aura-eyebrow" color="neutral" sx={{ mb: 1.5 }}>Your story, in small moments</Typography>
      <Typography component="h1" level="h1" className="aura-page-heading" mb={2}>
        Mood History
      </Typography>
      <Typography level="body-lg" color="neutral" sx={{ mb: 4 }}>A collection of who you’ve been, and how you’re becoming.</Typography>

      {/* ─── date filter UI ─────────────────────────────────────────── */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box className="aura-panel" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 3, p: 2.5, "& > *": { minWidth: 0 }, "& .MuiTextField-root": { flex: "1 1 180px" } }}>
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

      {loading && <Typography role="status" level="body-sm" sx={{ mb: 2 }}>Gathering your reflections…</Typography>}
      {failed && <Box role="alert" className="aura-panel" sx={{ p: 3, mb: 3 }}><Typography color="danger">We couldn’t load your reflections.</Typography><Button onClick={() => fetchLogs(startDate, endDate)}>Try again</Button></Box>}
      {!loading && !failed && !logs.length && <Box className="aura-panel" sx={{ p: 5, textAlign: "center", mb: 3 }}><Typography level="h2">Every story starts somewhere.</Typography><Typography level="body-md" color="neutral" sx={{ my: 2 }}>Your saved reflections will find their home here.</Typography><Button component="a" href="/log-mood" variant="solid">Write your first reflection ↗</Button></Box>}

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
