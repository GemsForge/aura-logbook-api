import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Box from "@mui/joy/Box";
import { AuraButton } from "@/components/ui/AuraButton";
import IconButton from "@mui/joy/IconButton";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import type { MoodEntry } from "@/features/mood/models/schema";
import type { MoodType } from "@/features/mood/models/schema/MoodType";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useGetAuraSeasonsQuery } from "@/store/auraApi";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

/** Shows daily tallies and tints each date with its most frequent mood while keeping selection chrome theme-owned. */
export default function MoodCalendar({
  entries,
  selectedDate,
  onSelectDate,
}: {
  entries: MoodEntry[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => dayjs().startOf("month"));
  const { data: seasons } = useGetAuraSeasonsQuery();
  const { data: referenceData } = useGetReferenceDataQuery();
  const today = dayjs().startOf("day");
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

  const firstGridDay = visibleMonth.startOf("month").startOf("week");
  const lastGridDay = visibleMonth.endOf("month").endOf("week");
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
  const entriesThisMonth = entries.filter((entry) =>
    dayjs(entry.date).isSame(visibleMonth, "month"),
  ).length;

  return (
    <Sheet component="section" className="aura-panel signed-in-calendar" aria-labelledby="mood-calendar-title" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, overflow: "hidden", position: "relative" }}>
      <Box sx={{ height: 3, position: "absolute", top: 0, left: "8%", right: "8%", borderRadius: "0 0 8px 8px", background: "linear-gradient(90deg, transparent, var(--aura-accent), var(--aura-glow), transparent)", opacity: 0.65 }} />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", color: "text.primary", background: "linear-gradient(145deg, var(--aura-wash), var(--al-theme-surface))", border: "1px solid var(--aura-line)", boxShadow: "0 4px 16px var(--aura-wash)" }}>
            <CalendarMonth aria-hidden="true" />
          </Box>
          <Box>
            <Typography id="mood-calendar-title" component="h2" level="h3">Mood calendar</Typography>
            <Typography level="body-sm" color="neutral" sx={{ mt: 0.25 }}>
              {entriesThisMonth} {entriesThisMonth === 1 ? "moment" : "moments"} marked this month
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, p: 0.5, borderRadius: "xl", border: "1px solid var(--aura-line)", backgroundColor: "var(--al-theme-surface)", boxShadow: "0 3px 12px var(--al-theme-glow)" }}>
          <IconButton
            variant="plain"
            aria-label="Previous month"
            onClick={() => {
              setVisibleMonth((month) => month.subtract(1, "month"));
              onSelectDate(null);
            }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography component="h3" level="title-md" aria-live="polite" sx={{ minWidth: { xs: 6.5, sm: 8 }, textAlign: "center" }}>
            {visibleMonth.format("MMMM YYYY")}
          </Typography>
          <IconButton
            variant="plain"
            aria-label="Next month"
            disabled={!visibleMonth.isBefore(today, "month")}
            onClick={() => {
              setVisibleMonth((month) => month.add(1, "month"));
              onSelectDate(null);
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      <Box
        component="table"
        aria-label={`Mood entries by day in ${visibleMonth.format("MMMM YYYY")}`}
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
                const moodTint = moodAura?.baseHex
                  ? `color-mix(in srgb, ${moodAura.baseHex} 30%, var(--al-theme-surface))`
                  : undefined;
                const selected = selectedDate === key;
                const outsideMonth = !day.isSame(visibleMonth, "month");
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
                        setVisibleMonth(day.startOf("month"));
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
                        borderRadius: "50%",
                        border: "1px solid",
                        borderColor: selected ? "var(--al-theme-focus)" : count ? "var(--al-theme-border)" : "transparent",
                        color: prominentMood ? (moodAura?.shades?.[700] ?? moodAura?.baseHex ?? "var(--al-theme-ink)") : "var(--al-theme-ink)",
                        background: moodTint ?? "transparent",
                        boxShadow: selected ? "0 0 0 2px var(--al-theme-surface), 0 0 0 4px var(--al-theme-focus)" : "none",
                        opacity: outsideMonth ? 0.55 : 1,
                        "&:hover": { background: moodTint ?? "var(--al-theme-surface-raised)", borderColor: "var(--al-theme-control-border)", transform: "translateY(-1px)" },
                        "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 1 },
                        transition: "background-color .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease",
                        "@media (prefers-reduced-motion: reduce)": {
                          transition: "none",
                          "&:hover": { transform: "none" },
                        },
                      }}
                    >
                      <Typography level="title-sm" sx={{ lineHeight: 1.15, fontWeight: count || selected ? 700 : 500 }}>{day.date()}</Typography>
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

      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 1, mt: 1 }}>
        <Typography level="body-xs" color="neutral">
          Each day’s color shows its most frequent mood. Tallies mark saved entries; select a day to read its reflections.
        </Typography>
        {selectedDate && (
          <AuraButton variant="outlined" size="small" aria-label="Clear selected calendar day" onClick={() => onSelectDate(null)}>
            Clear day
          </AuraButton>
        )}
      </Box>
    </Sheet>
  );
}
