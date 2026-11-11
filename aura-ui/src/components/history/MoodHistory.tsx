import type { MoodEntry } from "@/features/mood/models/schema";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { MoodApi } from "../../api/MoodApi";
import { useToast } from "../../hooks/useToast";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import MoodUpdateModal from "../MoodUpdateModal";
import { MoodCard } from "./MoodCard";
import { downloadJournalExport } from "@/features/mood/utils/journalExport";
import MoodCalendar from "./MoodCalendar";
import { ThemeBanner } from "@/components/ui/ThemeBanner";

/** Presents API-backed journal entries and calendar filters in a compact, scannable history view. */
export default function MoodHistoryPage() {
  const [logs, setLogs] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // filter state
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const [entryToEdit, setEntryToEdit] = useState<MoodEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<MoodEntry | null>(null);
  const { showToast } = useToast();

  const fetchLogs = useCallback(
    async (start?: Dayjs | null, end?: Dayjs | null) => {
      setSelectedCalendarDate(null);
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

  const visibleLogs = selectedCalendarDate
    ? logs.filter((entry) => entry.date === selectedCalendarDate)
    : logs;

  return (
    <Box className="signed-in-content" maxWidth={1000} mx="auto">
      <ThemeBanner title="Mood History" description="A collection of who you’ve been, and how you’re becoming." illustration="calendar" />

      {/* ─── date filter UI ─────────────────────────────────────────── */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box className="aura-panel" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 2, p: 1.25, "& > *": { minWidth: 0 }, "& .MuiTextField-root": { flex: "1 1 136px" } }}>
          <DatePicker
            label="Start date"
            value={startDate}
            onChange={setStartDate}
            disableFuture
            format="YYYY-MM-DD"
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="End date"
            value={endDate}
            onChange={setEndDate}
            disableFuture
            minDate={startDate ?? undefined}
            format="YYYY-MM-DD"
            slotProps={{ textField: { size: "small" } }}
          />
          <Button
            variant="contained"
            onClick={() => fetchLogs(startDate, endDate)}>
            Filter
          </Button>
          <Button
            variant="outlined"
            onClick={() => downloadJournalExport(logs)}
            disabled={loading || failed || logs.length === 0}
            aria-label={`Export ${logs.length} journal entries as JSON`}
          >
            Export journal JSON
          </Button>
        </Box>
      </LocalizationProvider>

      {loading && <Typography role="status" level="body-sm" sx={{ mb: 1.5 }}>Gathering your reflections…</Typography>}
      {failed && <Box role="alert" className="aura-panel" sx={{ p: 2, mb: 2 }}><Typography color="danger">We couldn’t load your reflections.</Typography><Button onClick={() => fetchLogs(startDate, endDate)}>Try again</Button></Box>}
      {!loading && !failed && !logs.length && <Box className="aura-panel" sx={{ p: 3, textAlign: "center", mb: 2 }}><Typography level="h2">Every story starts somewhere.</Typography><Typography level="body-md" color="neutral" sx={{ my: 1 }}>Your saved reflections will find their home here.</Typography><Button component="a" href="/log-mood" variant="solid">Write your first reflection ↗</Button></Box>}

      {!loading && !failed && logs.length > 0 && (
        <MoodCalendar
          entries={logs}
          selectedDate={selectedCalendarDate}
          onSelectDate={setSelectedCalendarDate}
        />
      )}

      {selectedCalendarDate && visibleLogs.length === 0 && (
        <Box role="status" className="aura-panel" sx={{ p: 2, mb: 2 }}>
          <Typography>No reflections are saved for {dayjs(selectedCalendarDate).format("MMMM D, YYYY")}.</Typography>
        </Box>
      )}

      {selectedCalendarDate && visibleLogs.length > 0 && (
        <Typography component="h2" level="h3" sx={{ mb: 1.5 }}>
          Reflections for {dayjs(selectedCalendarDate).format("MMMM D, YYYY")}
        </Typography>
      )}

      <Box className="signed-in-history-list">
        {visibleLogs.map((entry) => (
          <MoodCard
            key={entry.id}
            entry={entry}
            onEdit={setEntryToEdit}
            onDelete={setEntryToDelete}
          />
        ))}
      </Box>

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
