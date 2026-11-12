import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import type { MoodEntry } from "@/features/mood/models/schema";
import type { MoodType } from "@/features/mood/models/schema/MoodType";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useGetAuraSeasonsQuery } from "@/store/auraApi";
import { getAccessibleTextColor } from "@/theme/auraTheme";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Calendar density: one week row, or the full month grid. */
type CalendarView = "week" | "month";
/** Per-browser key for the viewer's last calendar density choice. */
const VIEW_STORAGE_KEY = "aura.reflections.calendarView";
/** Reads the stored choice; defaults to the compact week row, and survives blocked storage. */
function readStoredView(): CalendarView {
  try { return localStorage.getItem(VIEW_STORAGE_KEY) === "month" ? "month" : "week"; } catch { return "week"; }
}
/** True at the md breakpoint and up, where the calendar sits beside the journal and always shows the month. */
function useIsDesktop() {
  const query = "(min-width: 900px)";
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const update = () => setMatches(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return matches;
}
const visuallyHidden = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const;
/** Outlined round arrows drawn in theme ink so they keep contrast on dark surfaces. */
const navButtonSx = { borderRadius: "50%", color: "var(--al-theme-ink)", borderColor: "var(--al-theme-control-border, var(--al-theme-border))", "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } } as const;

/** Draws standard groups of five tally strokes; the date button keeps the exact count for assistive technology. */
function MoodEntryTallies({ count }: { count: number }) {
  const groups = Array.from({ length: Math.ceil(count / 5) }, (_, index) =>
    Math.min(5, count - index * 5),
  );

  return (
    <Box aria-hidden="true" sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 0.25, maxWidth: "100%" }}>
      {groups.map((marks, groupIndex) => (
        <svg key={groupIndex} width="20" height="12" viewBox="0 0 20 12" focusable="false">
          {Array.from({ length: Math.min(marks, 4) }, (_, markIndex) => (
            <line
              key={markIndex}
              x1={2 + markIndex * 4}
              y1="1.5"
              x2={2 + markIndex * 4}
              y2="10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}
          {marks === 5 && (
            <line x1="1" y1="10.5" x2="17" y2="1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          )}
        </svg>
      ))}
    </Box>
  );
}

/**
 * Mood calendar with a Week/Month toggle on phones and tablets (desktop always shows the month). Each day
 * with entries is filled with a light shade of its most frequent mood's aura color, with the number in a
 * contrast-checked ink so it stays legible in light and dark themes. Arrows step by the visible unit.
 */
export default function MoodCalendar({
  entries,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: {
  entries: MoodEntry[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  /** Called with the first day of the month whenever the visible month changes, so page stats can follow it. */
  onMonthChange?: (month: Dayjs) => void;
}) {
  const today = dayjs().startOf("day");
  const [visibleMonth, setVisibleMonth] = useState(() => dayjs().startOf("month"));
  const [weekStart, setWeekStart] = useState(() => dayjs().startOf("week"));
  const isDesktop = useIsDesktop();
  const [preferredView, setPreferredView] = useState<CalendarView>(readStoredView);
  // Desktop has room for the whole month beside the journal, so the toggle only applies on smaller screens.
  const view: CalendarView = isDesktop ? "month" : preferredView;
  const chooseView = (next: CalendarView) => {
    setPreferredView(next);
    try { localStorage.setItem(VIEW_STORAGE_KEY, next); } catch { /* storage may be unavailable; the choice still applies this visit */ }
    if (next === "week") setWeekStart((selectedDate ? dayjs(selectedDate) : today).startOf("week"));
    else setVisibleMonth(weekStart.startOf("month"));
  };
  // Page stats follow the month being viewed; in week view that is the month the week starts in.
  const reportedMonth = view === "week" ? weekStart.startOf("month") : visibleMonth;
  useEffect(() => { onMonthChange?.(reportedMonth); }, [reportedMonth.valueOf(), onMonthChange]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: seasons } = useGetAuraSeasonsQuery();
  const { data: referenceData } = useGetReferenceDataQuery();
  const entryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      counts.set(entry.date, (counts.get(entry.date) ?? 0) + 1);
    }
    return counts;
  }, [entries]);
  const dominantMoods = useMemo(() => {
    const dailyCounts = new Map<string, Map<MoodType, number>>();
    for (const entry of entries) {
      const moodCounts = dailyCounts.get(entry.date) ?? new Map<MoodType, number>();
      for (const mood of entry.moods) moodCounts.set(mood, (moodCounts.get(mood) ?? 0) + 1);
      dailyCounts.set(entry.date, moodCounts);
    }

    const sortOrder = new Map((referenceData?.moods ?? []).map((mood) => [mood.key, mood.sortOrder]));
    const result = new Map<string, MoodType>();
    for (const [date, moodCounts] of dailyCounts) {
      const [mood] = [...moodCounts].sort(([leftMood, leftCount], [rightMood, rightCount]) =>
        rightCount - leftCount
        || (sortOrder.get(leftMood) ?? Number.MAX_SAFE_INTEGER) - (sortOrder.get(rightMood) ?? Number.MAX_SAFE_INTEGER)
        || (leftMood < rightMood ? -1 : leftMood > rightMood ? 1 : 0),
      )[0] ?? [];
      if (mood) result.set(date, mood);
    }
    return result;
  }, [entries, referenceData?.moods]);

  const firstGridDay = view === "week" ? weekStart : visibleMonth.startOf("month").startOf("week");
  const lastGridDay = view === "week" ? weekStart.add(6, "day") : visibleMonth.endOf("month").endOf("week");
  const days: Dayjs[] = [];
  for (
    let day = firstGridDay;
    day.isBefore(lastGridDay, "day") || day.isSame(lastGridDay, "day");
    day = day.add(1, "day")
  ) {
    days.push(day);
  }
  const weeks: Dayjs[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  const rangeLabel = view === "week"
    ? `${weekStart.format("MMM D")} – ${weekStart.add(6, "day").format(weekStart.month() === weekStart.add(6, "day").month() ? "D" : "MMM D")}`
    : visibleMonth.format("MMMM YYYY");
  const unit = view === "week" ? "week" : "month";
  const step = (direction: 1 | -1) => {
    if (view === "week") setWeekStart((start) => start.add(direction, "week"));
    else setVisibleMonth((month) => month.add(direction, "month"));
    onSelectDate(null);
  };
  const canGoNext = view === "week" ? weekStart.add(1, "week").isBefore(today.add(1, "day"), "day") : visibleMonth.isBefore(today, "month");

  return (
    <Sheet component="section" className="aura-panel signed-in-calendar" aria-labelledby="mood-calendar-title" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, overflow: "hidden", position: "relative" }}>
      <Box sx={{ height: 3, position: "absolute", top: 0, left: "8%", right: "8%", borderRadius: "0 0 8px 8px", background: "linear-gradient(90deg, transparent, var(--aura-accent), var(--aura-glow), transparent)", opacity: 0.65 }} />
      <Typography id="mood-calendar-title" component="h2" sx={visuallyHidden}>Mood calendar</Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: .5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: .25 }}>
          <IconButton variant="outlined" size="sm" aria-label={`Previous ${unit}`} onClick={() => step(-1)} sx={navButtonSx}>
            <ChevronLeft fontSize="small" />
          </IconButton>
          {/* Compact range label; announced politely so stepping weeks or months is heard. */}
          <Typography component="h3" level="title-sm" aria-live="polite" sx={{ minWidth: { xs: 7, sm: 8 }, textAlign: "center", fontSize: "0.85rem", fontWeight: 600, color: "var(--al-theme-ink)" }}>
            {rangeLabel}
          </Typography>
          <IconButton variant="outlined" size="sm" aria-label={`Next ${unit}`} disabled={!canGoNext} onClick={() => step(1)} sx={navButtonSx}>
            <ChevronRight fontSize="small" />
          </IconButton>
        </Box>
        {!isDesktop && (
          <Box role="group" aria-label="Calendar size" sx={{ display: "inline-flex", p: "2px", borderRadius: 999, border: "1px solid var(--al-theme-control-border, var(--al-theme-border))" }}>
            {(["week", "month"] as const).map((option) => (
              <Box key={option} component="button" type="button" aria-pressed={view === option} aria-controls="mood-calendar-grid" onClick={() => chooseView(option)}
                sx={{
                  border: 0, borderRadius: 999, px: 1.25, minHeight: 28, font: "inherit", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                  // Selected uses ink-on-surface inversion so it reads in light and dark themes alike.
                  bgcolor: view === option ? "var(--al-theme-ink)" : "transparent",
                  color: view === option ? "var(--al-theme-surface)" : "var(--al-theme-ink)",
                  "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 },
                }}>
                {option === "week" ? "Week" : "Month"}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box
        component="table"
        id="mood-calendar-grid"
        aria-label={`Mood entries by day, ${view === "week" ? `week of ${rangeLabel}` : rangeLabel}`}
        sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: { xs: "4px", sm: "8px" } }}
      >
        <Box component="thead">
          <Box component="tr">
            {weekDays.map((weekday) => (
              <Box component="th" scope="col" key={weekday} sx={{ p: 0, pb: 0.75, textAlign: "center" }}>
                <Typography level="body-xs" color="neutral" sx={{ fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{weekday}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {weeks.map((week) => (
            <Box component="tr" key={week[0]?.format("YYYY-MM-DD")}>
              {week.map((day) => {
                const key = day.format("YYYY-MM-DD");
                const count = entryCounts.get(key) ?? 0;
                const prominentMood = dominantMoods.get(key);
                const moodDefinition = referenceData?.moods.find((definition) => definition.key === prominentMood);
                const moodAura = referenceData?.auras.find((aura) => aura.key === moodDefinition?.auraColorKeys[0]);
                const moodTint = moodAura ? (moodAura.shades?.[200] ?? moodAura.baseHex) : undefined;
                const moodInk = moodTint ? getAccessibleTextColor(moodTint) : undefined;
                const selected = selectedDate === key;
                const outsideMonth = view === "month" && !day.isSame(visibleMonth, "month");
                const future = day.isAfter(today, "day");
                const season = seasons?.history.find((span) =>
                  key >= span.startedOn && (span.endedOn === null || key <= span.endedOn),
                );
                // Include the season ribbon and mood tint meanings because their visual marks are decorative.
                const seasonLabel = season ? `, ${season.name} season` : "";
                const moodLabel = prominentMood ? `, most frequent mood ${prominentMood}` : "";
                return (
                  <Box component="td" key={key} sx={{ p: 0, verticalAlign: "top" }}>
                    <IconButton
                      variant="plain"
                      disabled={future}
                      aria-label={`${day.format("dddd, MMMM D, YYYY")}, ${count} ${count === 1 ? "mood entry" : "mood entries"}${moodLabel}${seasonLabel}`}
                      aria-pressed={selected}
                      onClick={() => {
                        if (view === "month") setVisibleMonth(day.startOf("month"));
                        onSelectDate(selected ? null : key);
                      }}
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        // Near-square compact cells keep the calendar balanced in the desktop overview column.
                        maxWidth: { xs: 42, sm: 54 },
                        minHeight: { xs: 40, sm: 48 },
                        height: "auto",
                        aspectRatio: "1 / 1",
                        mx: "auto",
                        p: { xs: 0.25, sm: 0.5 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 0,
                        // Rounded squares, not circles, for each day.
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: selected ? "var(--al-theme-focus)" : count ? "var(--al-theme-border)" : "transparent",
                        color: moodInk ?? "var(--al-theme-ink)",
                        background: moodTint ?? "transparent",
                        boxShadow: selected ? "0 0 0 2px var(--al-theme-surface), 0 0 0 4px var(--al-theme-focus)" : "none",
                        opacity: outsideMonth ? 0.55 : 1,
                        // Keep the mood fill and contrast ink when Joy applies its pressed (selected) styles.
                        "&[aria-pressed='true']": { background: moodTint ?? "transparent", color: moodInk ?? "var(--al-theme-ink)" },
                        "&:hover": { background: moodTint ?? "var(--al-theme-surface-raised)", borderColor: "var(--al-theme-control-border)", transform: "translateY(-1px)" },
                        "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 1 },
                        transition: "background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease",
                        "@media (prefers-reduced-motion: reduce)": {
                          transition: "none",
                          "&:hover": { transform: "none" },
                        },
                      }}
                    >
                      <Typography level="title-sm" sx={{ color: "inherit", lineHeight: 1.15, fontWeight: count || selected ? 700 : 500 }}>{day.date()}</Typography>
                      <Box sx={{ minHeight: "1.1em", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {count > 0 && <MoodEntryTallies count={count} />}
                      </Box>
                      {season && <Box aria-hidden="true" sx={{ width: "80%", height: 3, borderRadius: 99, bgcolor: "var(--aura-accent)", opacity: 0.75 }} />}
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

    </Sheet>
  );
}
