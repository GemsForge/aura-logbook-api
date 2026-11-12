import type { MoodEntry } from "@/features/mood/models/schema";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import WbTwilightOutlined from "@mui/icons-material/WbTwilightOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
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

/**
 * Reflections reads like a journal: the banner carries the liveliest-time chip and export; the left column
 * holds this month's top mood, the streak, and the calendar (one prominent mood color per day); the right
 * column shows the selected day's entries in time order. Month arrows replace the old date-range form.
 */
export default function MoodHistoryPage() {
  const [logs, setLogs] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(() => dayjs().startOf("month"));
  // `?date=` (set by the reading view's back link) reopens the day the reader came from.
  const [selectedDate, setSelectedDate] = useState<string | null>(() => new URLSearchParams(window.location.search).get("date"));
  const [entryToEdit, setEntryToEdit] = useState<MoodEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<MoodEntry | null>(null);
  const { showToast } = useToast();
  // Held in a ref so a toast helper that changes identity between renders never re-triggers the load.
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const { data: referenceData } = useGetReferenceDataQuery();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setLogs(await MoodApi.getAllMoods());
    } catch {
      setFailed(true);
      showToastRef.current("Failed to load mood history", "error");
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);
  const onMonthChange = useCallback((month: Dayjs) => setVisibleMonth(month), []);

  const monthLogs = logs.filter((entry) => dayjs(entry.date).isSame(visibleMonth, "month"));
  // With no day picked, open the month's most recent reflection day so the journal column is never empty.
  const latestDay = [...monthLogs].sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? null;
  const activeDate = selectedDate ?? latestDay;
  const dayEntries = logs
    .filter((entry) => entry.date === activeDate)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));

  const liveliest = liveliestTime(logs, referenceData?.moods ?? []);
  const topMood = topMoodByDay(monthLogs);
  const streak = computeCheckInStreak(logs);
  const topMoodDefinition = referenceData?.moods.find((definition) => definition.key === topMood?.mood);
  const topMoodAura = referenceData?.auras.find((aura) => aura.key === topMoodDefinition?.auraColorKeys[0]);
  const topMoodColor = topMoodAura?.shades?.[500] ?? topMoodAura?.baseHex ?? "var(--al-theme-primary)";
  const topMoodSurface = topMoodAura?.shades?.[100] ?? topMoodAura?.baseHex;
  const topMoodInk = topMoodSurface ? getAccessibleTextColor(topMoodSurface) : "var(--al-theme-ink)";

  return (
    <Box className="signed-in-content" maxWidth={1100} mx="auto">
      <ThemeBanner title="Reflections" description="Every check-in you’ve written, by day." illustration="calendar">
        {liveliest && (
          <Box component="span" aria-label={`Liveliest time: ${liveliest.name}, ${liveliest.range}, ${liveliest.count} check-ins`} title={`${liveliest.range} · ${liveliest.count} check-ins`}
            sx={{ display: "inline-flex", alignItems: "center", gap: .5, px: 1.25, height: 32, borderRadius: 999, fontSize: "var(--joy-fontSize-xs)", bgcolor: "color-mix(in srgb, #b8862b 28%, var(--al-theme-surface-raised))", color: "var(--al-theme-ink)" }}>
            <WbTwilightOutlined aria-hidden="true" sx={{ fontSize: 16 }} />Liveliest: {liveliest.name}
          </Box>
        )}
        <Button variant="outlined" size="small" startIcon={<FileDownloadOutlined />} onClick={() => downloadJournalExport(logs)} disabled={loading || failed || logs.length === 0} aria-label={`Export ${logs.length} journal entries as JSON`}>
          Export
        </Button>
      </ThemeBanner>

      {loading && <Typography role="status" level="body-sm" sx={{ mb: 1.5 }}>Gathering your reflections…</Typography>}
      {failed && <Box role="alert" className="aura-panel" sx={{ p: 2, mb: 2 }}><Typography color="danger">We couldn’t load your reflections.</Typography><Button onClick={() => fetchLogs()}>Try again</Button></Box>}
      {!loading && !failed && !logs.length && <Box className="aura-panel" sx={{ p: 3, textAlign: "center", mb: 2 }}><Typography level="h2">Every story starts somewhere.</Typography><Typography level="body-md" color="neutral" sx={{ my: 1 }}>Your saved reflections will find their home here.</Typography><Button component="a" href="/log-mood" variant="solid">Write your first reflection</Button></Box>}

      {!loading && !failed && logs.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.05fr) minmax(0, 1fr)" }, gap: 2, alignItems: "start", mb: 2 }}>
          <Box sx={{ display: "grid", gap: 1.5, minWidth: 0, "& .signed-in-calendar": { mb: 0 } }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 1.5 }}>
              <Sheet component="section" aria-label={topMood ? `Top mood in ${visibleMonth.format("MMMM")}: ${topMood.mood}, ${topMood.count} of ${topMood.totalDays} days` : "Top mood"} sx={{ p: 1.75, minWidth: 0, borderRadius: "xl", border: "1px solid var(--al-theme-border)", background: topMood ? (topMoodSurface ?? "var(--al-theme-surface-raised)") : "var(--al-theme-surface-raised)", color: topMood ? topMoodInk : undefined }}>
                <Typography level="body-xs" sx={{ color: "inherit", opacity: .78 }}>Top mood · {visibleMonth.format("MMMM")}</Typography>
                <Typography sx={{ color: "inherit", fontFamily: "var(--joy-fontFamily-display)", fontSize: "1.6rem", lineHeight: 1.1, mt: .5, overflowWrap: "anywhere" }}>{topMood?.mood ?? "—"}</Typography>
                <Typography level="body-xs" sx={{ color: "inherit", opacity: .78, mt: .25 }}>{topMood ? `${topMood.count} of ${topMood.totalDays} days` : "No check-ins this month"}</Typography>
              </Sheet>
              <Sheet component="section" aria-label={`Streak: ${streak} ${streak === 1 ? "day" : "days"}`} sx={{ p: 1.75, minWidth: 0, borderRadius: "xl", border: "1px solid var(--al-theme-border)", background: "var(--al-theme-surface-raised)" }}>
                <Typography level="body-xs" color="neutral">Streak</Typography>
                <Typography sx={{ fontFamily: "var(--joy-fontFamily-display)", fontSize: "1.6rem", lineHeight: 1.1, mt: .5 }}>{streak} {streak === 1 ? "day" : "days"}</Typography>
                <Box aria-hidden="true" sx={{ display: "flex", gap: .5, mt: .75, minHeight: 9 }}>
                  {Array.from({ length: Math.min(streak, 7) }, (_, index) => <Box key={index} component="span" sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: topMoodColor }} />)}
                </Box>
              </Sheet>
            </Box>
            <MoodCalendar entries={logs} selectedDate={activeDate} onSelectDate={setSelectedDate} onMonthChange={onMonthChange} />
          </Box>

          <Sheet component="section" aria-labelledby="reflection-day-title" className="aura-panel" sx={{ p: { xs: 1.75, sm: 2.25 }, minWidth: 0, display: "grid", gap: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
              <Typography id="reflection-day-title" component="h2" sx={{ fontFamily: "var(--joy-fontFamily-display)", fontSize: "1.35rem" }}>
                {activeDate ? dayjs(activeDate).format("dddd, MMMM D") : visibleMonth.format("MMMM YYYY")}
              </Typography>
              {dayEntries.length > 0 && <Typography level="body-xs" color="neutral">{dayEntries.length} {dayEntries.length === 1 ? "check-in" : "check-ins"}</Typography>}
            </Box>
            {dayEntries.length === 0
              ? <Typography role="status" level="body-sm" color="neutral">{activeDate ? "No reflections were saved this day." : "No reflections this month. Pick a day with color to read it."}</Typography>
              : dayEntries.map((entry) => <MoodCard key={entry.id} entry={entry} onEdit={setEntryToEdit} onDelete={setEntryToDelete} />)}
            <Button component="a" href="/log-mood" variant="outlined" size="small" startIcon={<AddOutlined />} sx={{ justifySelf: "start" }}>Add a reflection</Button>
          </Sheet>
        </Box>
      )}

      {entryToEdit && <MoodUpdateModal entry={entryToEdit} onClose={() => setEntryToEdit(null)} onSuccess={fetchLogs} />}
      {entryToDelete && <DeleteConfirmDialog entry={entryToDelete} onClose={() => setEntryToDelete(null)} onConfirm={handleDelete} />}
    </Box>
  );
}
