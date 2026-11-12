import type { MoodEntry } from "@/features/mood/models/schema";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
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
import { liveliestTime } from "@/features/insights/insightMetrics";
import { computeCheckInStreak } from "@/features/mood/moodPatternSummary";
import { getAccessibleTextColor } from "@/theme/auraTheme";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";

/** Counts moods by distinct check-in day so a busy day does not outweigh quieter days. */
function topMoodByDay(entries: MoodEntry[]) {
  const days = new Set(entries.map((entry) => entry.date));
  const moodDays = new Map<string, Set<string>>();
  for (const entry of entries) {
    for (const mood of entry.moods) {
      const dates = moodDays.get(mood) ?? new Set<string>();
      dates.add(entry.date);
      moodDays.set(mood, dates);
    }
  }
  const [mood, moodDates] = [...moodDays.entries()].sort((a, b) =>
    b[1].size - a[1].size || a[0].localeCompare(b[0]),
  )[0] ?? [];
  return mood && moodDates ? { mood, count: moodDates.size, totalDays: days.size } : null;
}

/** Presents API-backed reflections with a compact calendar, personal highlights, date filters, and entry actions. */
export default function MoodHistoryPage() {
  const [logs, setLogs] = useState<MoodEntry[]>([]);
  const [allLogs, setAllLogs] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // filter state
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const [entryToEdit, setEntryToEdit] = useState<MoodEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<MoodEntry | null>(null);
  const { showToast } = useToast();
  const { data: referenceData } = useGetReferenceDataQuery();

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
        // Keep the current streak independent of the optional date filter applied to the list.
        if (!start && !end) setAllLogs(res);
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

  // Liveliest part of the day across the listed reflections (respects the date filter); hidden until a part has 3+ check-ins.
  const liveliest = liveliestTime(logs, referenceData?.moods ?? []);
  const topMood = topMoodByDay(logs);
  const streak = computeCheckInStreak(allLogs);
  const topMoodDefinition = referenceData?.moods.find((definition) => definition.key === topMood?.mood);
  const topMoodAura = referenceData?.auras.find((aura) => aura.key === topMoodDefinition?.auraColorKeys[0]);
  const topMoodColor = topMoodAura?.shades?.[500] ?? topMoodAura?.baseHex ?? "var(--al-theme-primary)";
  const topMoodSurface = topMoodAura?.shades?.[100] ?? topMoodAura?.baseHex;
  const topMoodInk = topMoodSurface ? getAccessibleTextColor(topMoodSurface) : "var(--al-theme-ink)";

  return (
    <Box className="signed-in-content" maxWidth={1000} mx="auto">
      <ThemeBanner title="Reflections" description="Every check-in you’ve written, by day." illustration="calendar" />

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
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.2fr) minmax(250px, .8fr)" }, gap: 2, alignItems: "start", mb: 2 }}>
          <Box sx={{ minWidth: 0, "& .signed-in-calendar": { mb: 0 } }}>
            <MoodCalendar
              entries={logs}
              selectedDate={selectedCalendarDate}
              onSelectDate={setSelectedCalendarDate}
            />
          </Box>
          <Box component="aside" aria-label="Reflection highlights" sx={{ display: "grid", gap: 1.25, minWidth: 0 }}>
            {liveliest && (
              <Sheet component="section" aria-label={`Liveliest time: ${liveliest.name}, ${liveliest.range}, ${liveliest.count} check-ins`} sx={{ p: 2, borderRadius: "xl", border: "1px solid var(--al-theme-border)", background: "color-mix(in srgb, var(--al-theme-primary) 12%, var(--al-theme-surface-raised))" }}>
                <Typography level="body-sm" color="neutral">Liveliest time</Typography>
                <Typography sx={{ fontFamily: "var(--joy-fontFamily-display)", fontSize: "2rem", lineHeight: 1.1, mt: .5 }}>{liveliest.name}</Typography>
                <Typography level="body-xs" sx={{ mt: .25 }}>{liveliest.range} · {liveliest.count} check-ins</Typography>
              </Sheet>
            )}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
              {topMood && (
                <Sheet component="section" aria-label={`Top mood: ${topMood.mood}, ${topMood.count} of ${topMood.totalDays} days`} sx={{ p: 2, minWidth: 0, borderRadius: "xl", border: "1px solid var(--al-theme-border)", background: topMoodSurface ?? "var(--al-theme-surface-raised)", color: topMoodInk }}>
                  <Typography level="body-sm" sx={{ color: "inherit", opacity: .78 }}>Top mood</Typography>
                  <Typography sx={{ fontFamily: "var(--joy-fontFamily-display)", fontSize: "1.75rem", lineHeight: 1.1, mt: .75, overflowWrap: "anywhere" }}>{topMood.mood}</Typography>
                  <Typography level="body-xs" sx={{ color: "inherit", opacity: .78, mt: .5 }}>{topMood.count} of {topMood.totalDays} days</Typography>
                </Sheet>
              )}
              <Sheet component="section" aria-label={`Streak: ${streak} ${streak === 1 ? "day" : "days"}`} sx={{ p: 2, minWidth: 0, borderRadius: "xl", border: "1px solid var(--al-theme-border)", background: "var(--al-theme-surface-raised)" }}>
                <Typography level="body-sm" color="neutral">Streak</Typography>
                <Box aria-hidden="true" sx={{ display: "flex", gap: .6, mt: 1.25, minHeight: 14 }}>
                  {Array.from({ length: Math.min(streak, 7) }, (_, index) => <Box key={index} component="span" sx={{ width: 13, height: 13, borderRadius: "50%", bgcolor: topMoodColor, flex: "0 0 auto" }} />)}
                </Box>
                <Typography sx={{ fontFamily: "var(--joy-fontFamily-display)", fontSize: "1.75rem", lineHeight: 1.1, mt: .75 }}>{streak} {streak === 1 ? "day" : "days"}</Typography>
                <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>{streak > 0 ? "in a row" : "Starts with your next check-in"}</Typography>
              </Sheet>
            </Box>
          </Box>
        </Box>
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
