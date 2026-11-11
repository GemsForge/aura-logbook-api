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

/** Shows API-backed daily mood tallies and filters History using theme-aware calendar surfaces. */
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
  const today = dayjs().startOf("day");
  const entryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      counts.set(entry.date, (counts.get(entry.date) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

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
    <Sheet component="section" className="aura-panel" aria-labelledby="mood-calendar-title" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, overflow: "hidden", position: "relative" }}>
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
                const selected = selectedDate === key;
                const outsideMonth = !day.isSame(visibleMonth, "month");
                const future = day.isAfter(today, "day");
                const season = seasons?.history.find((span) =>
                  key >= span.startedOn && (span.endedOn === null || key <= span.endedOn),
                );
                // Include the ribbon's meaning in the button name because its visual mark is decorative.
                const seasonLabel = season ? `, ${season.name} season` : "";
                return (
                  <Box component="td" key={key} sx={{ p: 0, verticalAlign: "top" }}>
                    <IconButton
                      variant="plain"
                      disabled={future}
                      aria-label={`${day.format("dddd, MMMM D, YYYY")}, ${count} ${count === 1 ? "mood entry" : "mood entries"}${seasonLabel}`}
                      aria-pressed={selected}
                      onClick={() => {
                        setVisibleMonth(day.startOf("month"));
                        onSelectDate(selected ? null : key);
                      }}
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        // Compact cells: room for the date and up to one row of tallies.
                        minHeight: { xs: 40, sm: 50 },
                        height: "auto",
                        p: { xs: 0.25, sm: 0.5 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 0,
                        borderRadius: "md",
                        border: "1px solid",
                        borderColor: selected ? "var(--aura-accent)" : count ? "var(--aura-line)" : "transparent",
                        background: selected
                          ? "linear-gradient(145deg, var(--aura-wash), var(--al-theme-surface))"
                          : count
                            ? "linear-gradient(145deg, var(--aura-wash), color-mix(in srgb, var(--al-theme-surface) 82%, transparent))"
                          : "transparent",
                        boxShadow: selected ? "0 0 0 2px var(--aura-wash), 0 5px 16px var(--aura-glow)" : count ? "0 2px 8px var(--al-theme-glow)" : "none",
                        opacity: outsideMonth ? 0.55 : 1,
                        "&:hover": { background: "linear-gradient(145deg, var(--aura-wash), var(--al-theme-surface))", borderColor: "var(--aura-accent)", transform: "translateY(-1px)" },
                        "&:focus-visible": { outline: "2px solid var(--aura-accent)", outlineOffset: 1 },
                        transition: "background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease",
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
          Each tally marks a saved mood entry. Select a day to read its reflections.
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
