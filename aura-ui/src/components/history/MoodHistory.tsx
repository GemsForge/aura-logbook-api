import { compareMoodOccurrence } from "@/features/mood/moodOccurrenceTime";
import type { MoodEntry } from "@/features/mood/models/schema";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
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
import StatCard from "@/components/ui/StatCard";
import { liveliestTime } from "@/features/insights/insightMetrics";
import { computeCheckInStreak } from "@/features/mood/moodPatternSummary";
import { tapTarget44 } from "@/components/ui/tapTarget";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useAppDispatch } from "@/store/hooks";
import { auraApi } from "@/store/auraApi";
import { PathwayReflectionCard } from "@/features/pathways/components/PathwayReflectionJournal";
import type { PathwayActivity, PathwayActivityRequest } from "@/features/pathways/pathwayActivityApi";
import { PathwayActivityApi } from "@/features/pathways/pathwayActivityApi";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import { PATHWAY_MODULES, pathwayModuleKey, resolvePathwayFocus } from "@/features/pathways/pathwayResources";
import { useAppSelector } from "@/store/hooks";

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
  const dispatch = useAppDispatch();
  const [logs, setLogs] = useState<MoodEntry[]>([]);
  const [pathwayItems, setPathwayItems] = useState<PathwayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(() => dayjs().startOf("month"));
  // `?date=` (set by the reading view's back link) reopens the day the reader came from.
  const [selectedDate, setSelectedDate] = useState<string | null>(() => new URLSearchParams(window.location.search).get("date"));
  const [entryToEdit, setEntryToEdit] = useState<MoodEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<MoodEntry | null>(null);
  const [pathwayToDelete, setPathwayToDelete] = useState<PathwayActivity | null>(null);
  const [pathwayToEdit, setPathwayToEdit] = useState<PathwayActivity | null>(null);
  const [pathwayDraft, setPathwayDraft] = useState("");
  const [pathwayMessage, setPathwayMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "check-ins" | "pathway">(() => {
    try { const saved = localStorage.getItem("aura.reflections.filter"); return saved === "check-ins" || saved === "pathway" ? saved : "all"; } catch { return "all"; }
  });
  const [showInactive, setShowInactive] = useState(() => {
    try { return localStorage.getItem("aura.reflections.showInactivePathways") !== "false"; } catch { return true; }
  });
  const { showToast } = useToast();
  // Held in a ref so a toast helper that changes identity between renders never re-triggers the load.
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const { data: referenceData } = useGetReferenceDataQuery();
  const user = useAppSelector((state) => state.auth.profile);

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
      // Deleting a mood removes its contribution from the current reflected color.
      dispatch(auraApi.util.invalidateTags(["Aura", "AuraSeasons"]));
      showToast("Mood entry deleted", "success");
      setEntryToDelete(null);
      fetchLogs();
    } catch {
      showToast("Failed to delete mood entry", "error");
    }
  };

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);
  const fetchPathwayItems = useCallback(async () => {
    try { setPathwayItems(await PathwayActivityApi.getMine({ activityType: "pathway-reflection" })); }
    catch { setPathwayMessage("Saved pathway reflections aren’t available right now."); }
  }, []);
  useEffect(() => { void fetchPathwayItems(); }, [fetchPathwayItems]);
  const onMonthChange = useCallback((month: Dayjs) => setVisibleMonth(month), []);

  const monthLogs = logs.filter((entry) => dayjs(entry.date).isSame(visibleMonth, "month"));
  const pathwayReflections = pathwayItems.filter((item) => item.activityType === "pathway-reflection" && "responseText" in item.content && "prompt" in item.content && "insightType" in item.content);
  const selectedPathwayKey = pathwayModuleKey(user?.selectedPathway);
  const activeModules = new Set(selectedPathwayKey ? resolvePathwayFocus(user?.selectedPathway, user?.pathwayPreferences?.focus) : []);
  const isActiveReflection = (item: PathwayActivity) => {
    const moduleExists = Object.values(PATHWAY_MODULES).some((modules) => modules.some((module) => module.key === item.moduleKey));
    return !moduleExists || (selectedPathwayKey === item.pathway && activeModules.has(item.moduleKey));
  };
  const visiblePathwayReflections = pathwayReflections.filter((item) => showInactive || isActiveReflection(item));
  // With no day picked, open the month's most recent reflection day so the journal column is never empty.
  const latestDay = [...monthLogs.map((entry) => entry.date), ...visiblePathwayReflections.map((item) => item.occurredOn).filter((date) => dayjs(date).isSame(visibleMonth, "month"))].sort((a, b) => b.localeCompare(a))[0] ?? null;
  const activeDate = selectedDate ?? latestDay;
  const dayEntries = logs
    .filter((entry) => entry.date === activeDate)
    .sort(compareMoodOccurrence);
  const dayPathwayReflections = visiblePathwayReflections.filter((item) => item.occurredOn === activeDate).sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id - right.id);
  const dayMoodEntries = filter === "pathway" ? [] : dayEntries;
  const dayPathwayItems = filter === "check-ins" ? [] : dayPathwayReflections;
  const timeline = [
    ...dayMoodEntries.map((entry) => ({ kind: "mood" as const, entry, time: new Date(entry.occurredAt ?? entry.createdAt).getTime() })),
    ...dayPathwayItems.map((item) => ({ kind: "pathway" as const, item, time: new Date(item.createdAt).getTime() })),
  ].sort((left, right) => left.time - right.time);
  const chooseFilter = (value: "all" | "check-ins" | "pathway") => {
    setFilter(value);
    try { localStorage.setItem("aura.reflections.filter", value); } catch { /* Preference still applies for this visit. */ }
  };
  const chooseShowInactive = (checked: boolean) => {
    setShowInactive(checked);
    try { localStorage.setItem("aura.reflections.showInactivePathways", String(checked)); } catch { /* Preference still applies for this visit. */ }
  };
  const editPathway = (item: PathwayActivity) => { setPathwayToEdit(item); setPathwayDraft("responseText" in item.content ? item.content.responseText : ""); };
  const savePathwayEdit = async () => {
    if (!pathwayToEdit || !("responseText" in pathwayToEdit.content) || !("prompt" in pathwayToEdit.content)) return;
    const request: PathwayActivityRequest = { pathway: pathwayToEdit.pathway, moduleKey: pathwayToEdit.moduleKey, activityType: pathwayToEdit.activityType, occurredOn: pathwayToEdit.occurredOn, content: { ...pathwayToEdit.content, responseText: pathwayDraft.trim() } };
    try { await PathwayActivityApi.update(pathwayToEdit.id, request); setPathwayToEdit(null); setPathwayMessage("Journal reflection updated."); await fetchPathwayItems(); }
    catch { setPathwayMessage("Couldn’t update this reflection. Try again."); }
  };
  const deletePathway = async () => {
    if (!pathwayToDelete) return;
    try { await PathwayActivityApi.remove(pathwayToDelete.id); setPathwayToDelete(null); setPathwayMessage("Journal reflection deleted."); await fetchPathwayItems(); }
    catch { setPathwayMessage("Couldn’t delete this reflection. Try again."); }
  };

  const liveliest = liveliestTime(logs, referenceData?.moods ?? []);
  const topMood = topMoodByDay(monthLogs);
  const streak = computeCheckInStreak(logs);
  const topMoodDefinition = referenceData?.moods.find((definition) => definition.key === topMood?.mood);
  const topMoodAura = referenceData?.auras.find((aura) => aura.key === topMoodDefinition?.auraColorKeys[0]);
  const topMoodColor = topMoodAura?.shades?.[500] ?? topMoodAura?.baseHex ?? "var(--al-theme-primary)";
  const topMoodSurface = topMoodAura?.shades?.[100] ?? topMoodAura?.baseHex;

  return (
    <Box className="signed-in-content" maxWidth={1100} mx="auto">
      <ThemeBanner title="Reflections" description="Every check-in you’ve written, by day." illustration="calendar">
        {liveliest && (
          <Box component="span" aria-label={`Liveliest time: ${liveliest.name}, ${liveliest.range}, ${liveliest.count} check-ins`} title={`${liveliest.range} · ${liveliest.count} check-ins`}
            sx={{ display: "inline-flex", alignItems: "center", gap: .5, px: 1.25, height: 32, borderRadius: 999, fontSize: "var(--joy-fontSize-xs)", bgcolor: "color-mix(in srgb, #b8862b 28%, var(--al-theme-surface-raised))", color: "var(--al-theme-ink)" }}>
            <WbTwilightOutlined aria-hidden="true" sx={{ fontSize: 16 }} />Liveliest: {liveliest.name}
          </Box>
        )}
        {/* Compact icon action, matching the + button; the name and tooltip say what it downloads. */}
        <IconButton size="sm" variant="outlined" onClick={() => downloadJournalExport(logs)} disabled={loading || failed || logs.length === 0} aria-label={`Export ${logs.length} journal entries as JSON`} title="Export journal (JSON)" sx={{ borderRadius: "50%", ...tapTarget44 }}>
          <FileDownloadOutlined fontSize="small" />
        </IconButton>
      </ThemeBanner>

      {loading && <Typography role="status" level="body-sm" sx={{ mb: 1.5 }}>Gathering your reflections…</Typography>}
      {failed && <Box role="alert" className="aura-panel" sx={{ p: 2, mb: 2 }}><Typography color="danger">We couldn’t load your reflections.</Typography><Button onClick={() => fetchLogs()}>Try again</Button></Box>}
      {!loading && !failed && !logs.length && !visiblePathwayReflections.length && <Box className="aura-panel" sx={{ p: 3, textAlign: "center", mb: 2 }}><Typography level="h2">Every story starts somewhere.</Typography><Typography level="body-md" color="neutral" sx={{ my: 1 }}>Your saved reflections will find their home here.</Typography><Button component="a" href="/log-mood" variant="solid">Write your first reflection</Button></Box>}

      {!loading && !failed && (logs.length > 0 || visiblePathwayReflections.length > 0) && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.05fr) minmax(0, 1fr)" }, gap: 2, alignItems: "start", mb: 2 }}>
          <Box sx={{ display: "grid", gap: 1.5, minWidth: 0, "& .signed-in-calendar": { mb: 0 } }}>
                        {/* Stat cards are plain content, not labeled regions, so they add no landmarks (WCAG 1.3.1). */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 1 }}>
              <StatCard label={`Top mood · ${visibleMonth.format("MMMM")}`} value={topMood?.mood ?? "—"} tone={topMood ? topMoodSurface : undefined}
                caption={topMood ? `${topMood.count} of ${topMood.totalDays} days` : "No check-ins this month"} />
              <StatCard label="Streak" value={`${streak} ${streak === 1 ? "day" : "days"}`}
                adornment={<Box aria-hidden="true" sx={{ display: "flex", gap: .375 }}>{Array.from({ length: Math.min(streak, 7) }, (_, index) => <Box key={index} component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: topMoodColor }} />)}</Box>} />
            </Box>
            <MoodCalendar entries={logs} pathwayEntries={visiblePathwayReflections} selectedDate={activeDate} onSelectDate={setSelectedDate} onMonthChange={onMonthChange} filter={filter} />
          </Box>

          {/* One minmax(0, 1fr) track: an implicit auto track grows to the moment strip's full width, pushing
              cards, actions, and photos past the panel edge instead of letting the strip scroll inside it. */}
          <Sheet component="section" aria-labelledby="reflection-day-title" className="aura-panel" sx={{ p: { xs: 1.75, sm: 2.25 }, minWidth: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 2 }}>
            {/* Day heading, count, and a compact add action share one quiet row so the entries lead. */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography id="reflection-day-title" component="h2" sx={{ fontFamily: "var(--joy-fontFamily-display)", fontSize: "1.1rem", lineHeight: 1.25 }}>
                  {activeDate ? dayjs(activeDate).format("dddd, MMMM D") : visibleMonth.format("MMMM YYYY")}
                </Typography>
                {(dayEntries.length > 0 || dayPathwayReflections.length > 0) && <Typography level="body-xs" color="neutral">{filter === "pathway" ? `${dayPathwayReflections.length} ${dayPathwayReflections.length === 1 ? "pathway reflection" : "pathway reflections"}` : filter === "check-ins" ? `${dayEntries.length} ${dayEntries.length === 1 ? "check-in" : "check-ins"}` : `${dayEntries.length} ${dayEntries.length === 1 ? "check-in" : "check-ins"}${dayPathwayReflections.length > 0 ? ` · ${dayPathwayReflections.length} ${dayPathwayReflections.length === 1 ? "pathway reflection" : "pathway reflections"}` : ""}`}</Typography>}
              </Box>
              <SegmentedToggle label="Reflections filter" value={filter} onChange={chooseFilter} size="sm" options={[{ value: "all", label: "All" }, { value: "check-ins", label: "Check-ins" }, { value: "pathway", label: "Pathway reflections" }]} />
              <IconButton component="a" href="/log-mood" size="sm" variant="outlined" aria-label="Add a reflection" title="Add a reflection" sx={{ ...tapTarget44, borderRadius: "50%", flexShrink: 0 }}><AddOutlined fontSize="small" /></IconButton>
            </Box>
            <Box component="label" sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "var(--joy-fontSize-sm)" }}>
              <input type="checkbox" checked={showInactive} onChange={(event) => chooseShowInactive(event.target.checked)} /> Show reflections from inactive pathways
            </Box>
            {pathwayMessage && <Typography role="status" level="body-xs">{pathwayMessage}</Typography>}
            {timeline.length === 0
              ? <Typography role="status" level="body-sm" color="neutral">{filter === "pathway" ? "No pathway reflections this day." : filter === "check-ins" ? "No check-ins this day." : activeDate ? "No reflections were saved this day." : "No reflections this month. Pick a day to read it."}</Typography>
              : timeline.map((item) => item.kind === "mood"
                ? <MoodCard key={`mood-${item.entry.id}`} entry={item.entry} onEdit={setEntryToEdit} onDelete={setEntryToDelete} />
                : <PathwayReflectionCard key={`pathway-${item.item.id}`} item={item.item as PathwayActivity & { content: { prompt: string; responseText: string; insightType: string; reference?: string; segment?: string } }} onEdit={editPathway} onDelete={setPathwayToDelete} editing={pathwayToEdit?.id === item.item.id} draft={pathwayDraft} onDraftChange={setPathwayDraft} onCancelEdit={() => setPathwayToEdit(null)} onSave={() => void savePathwayEdit()} />)}
          </Sheet>
        </Box>
      )}


      {entryToEdit && <MoodUpdateModal entry={entryToEdit} onClose={() => setEntryToEdit(null)} onSuccess={fetchLogs} />}
      {entryToDelete && <DeleteConfirmDialog entry={entryToDelete} onClose={() => setEntryToDelete(null)} onConfirm={handleDelete} />}
      {pathwayToDelete && <Box role="alertdialog" aria-modal="true" aria-labelledby="delete-pathway-title" className="aura-panel" sx={{ position: "fixed", inset: 0, zIndex: 1500, display: "grid", placeContent: "center", bgcolor: "rgba(0,0,0,.45)", p: 2 }}><Sheet sx={{ p: 3, maxWidth: 400 }}><Typography id="delete-pathway-title" level="h2">Delete this pathway reflection?</Typography><Typography level="body-sm" sx={{ mt: 1 }}>This action cannot be undone.</Typography><Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}><Button variant="plain" onClick={() => setPathwayToDelete(null)}>Keep</Button><Button color="danger" onClick={() => void deletePathway()}>Delete</Button></Box></Sheet></Box>}
    </Box>
  );
}
