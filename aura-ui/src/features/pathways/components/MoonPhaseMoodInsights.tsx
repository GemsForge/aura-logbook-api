import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/joy";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { openProfileModal } from "@/store/slices/uiSlice";
import { useLogMoodMutation } from "@/store/moodApi";
import type { MoodType } from "@/features/mood/models/schema/MoodType";
import { orderMoodChoices } from "@/features/mood/orderMoodChoices";
import { MoodChoiceButton } from "@/components/mood/MoodChoiceButton";
import { getMoonCycle, type MoonCycleDay, getDailyHoroscope, type DailyHoroscope } from "../astrologyApi";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { useGetReferenceDataQuery as useReferenceData } from "@/store/referenceDataApi";
import { MoonPhaseDisc } from "./MoonPhaseDisc";
import { PathwaySteps, StepHeading } from "./PathwaySteps";
import { SunSignReading } from "./SunSignReading";
import { BirthChartReading } from "./BirthChartReading";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";

/** Connects one selected local date's moon, saved chart context, and mood record in a three-step path. */
export function MoonPhaseMoodInsights() {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const [selectedDate, setSelectedDate] = useState(() => localDate(new Date()));
  const [cycle, setCycle] = useState<MoonCycleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefetching, setPrefetching] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [step, setStep] = useState(0);
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  const [horoscopeUnavailable, setHoroscopeUnavailable] = useState(false);
  const [horoscopeAttempt, setHoroscopeAttempt] = useState(0);
  const [savingMood, setSavingMood] = useState<string | null>(null);
  const [moodSaveError, setMoodSaveError] = useState(false);
  const [logMood] = useLogMoodMutation();
  const { data: zodiac, isLoading: zodiacLoading } = useGetZodiacInsightQuery(undefined, { skip: !user?.birthday });
  const { data: referenceData } = useReferenceData();
  const moods = useMemo(() => orderMoodChoices(referenceData?.moods ?? [], referenceData?.auras ?? []), [referenceData]);
  const today = localDate(new Date());
  const dates = useMemo(() => Array.from({ length: 30 }, (_, index) => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() - 29 + index);
    return localDate(date);
  }), [today]);
  const selectedDay = cycle.find((day) => day.date === selectedDate);
  const dayButtons = useRef<(HTMLElement | null)[]>([]);
  const strip = useRef<HTMLDivElement>(null);
  // The strip opens on today (the newest, right-most date), as the wireframe specifies. Instant strip-only
  // scrolling avoids a page jump and respects reduced-motion preferences.
  useEffect(() => {
    if (strip.current) strip.current.scrollLeft = strip.current.scrollWidth;
  }, [dates]);
  const stepCount = user?.birthday ? 3 : 2;
  const birthDetailsSaved = Boolean(user?.pathwayPreferences?.saveBirthDetails && user.pathwayPreferences.birthTime && user.pathwayPreferences.birthPlace);

  useEffect(() => {
    let active = true;
    let firstRequest = true;
    let refreshTimer: number | undefined;
    setUnavailable(false);
    setPrefetching(false);
    const loadCycle = async () => {
      const showInitialLoading = firstRequest;
      firstRequest = false;
      if (showInitialLoading) setLoading(true);
      try {
        const result = await getMoonCycle(dates[0], dates[dates.length - 1]);
        if (!active) return;
        setCycle(result.days);
        setUnavailable(false);
        setPrefetching(result.isPrefetching ?? false);
        if (result.isPrefetching) refreshTimer = window.setTimeout(() => void loadCycle(), 2000);
      } catch {
        if (active) {
          setUnavailable(true);
          setPrefetching(false);
        }
      } finally {
        if (active && showInitialLoading) setLoading(false);
      }
    };
    void loadCycle();
    return () => {
      active = false;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    };
  }, [dates, today, attempt]);

  useEffect(() => {
    if (!user?.birthday) { setHoroscope(null); setHoroscopeUnavailable(false); return; }
    let active = true;
    setHoroscope(null);
    setHoroscopeUnavailable(false);
    void getDailyHoroscope()
      .then((reading) => { if (active) setHoroscope(reading); })
      .catch(() => { if (active) setHoroscopeUnavailable(true); });
    return () => { active = false; };
  }, [user?.birthday, horoscopeAttempt]);

  const selectDay = (date: string) => { setSelectedDate(date); setStep(0); };
  const onDayKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    const target = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : -1;
    if (target >= 0 && target < dates.length) {
      event.preventDefault();
      dayButtons.current[target]?.focus();
    }
  };

  const saveMood = async (mood: string) => {
    if (savingMood) return;
    setSavingMood(mood);
    setMoodSaveError(false);
    try {
      await logMood({ date: selectedDate, moods: [mood as MoodType] }).unwrap();
      setAttempt((value) => value + 1);
    } catch {
      setMoodSaveError(true);
    } finally {
      setSavingMood(null);
    }
  };

  const steps = [
    { title: "Today's sky", summary: selectedDay?.phase ?? "Moon details unavailable", content: <>
      {/* The selected day's moon is the step's hero; the sign reading follows as supporting context. */}
      {selectedDay?.phase ? <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
        <MoonPhaseDisc phase={selectedDay.phase} size={72} />
        <Box sx={{ minWidth: 0 }}><StepHeading>{selectedDay.phase}</StepHeading>
          <Typography level="body-sm" color="neutral">{selectedDay.moonSign ? `In ${selectedDay.moonSign}` : "Moon sign unavailable"} · {selectedDay.illumination !== null ? `${Math.round(selectedDay.illumination * 100)}% lit` : "Illumination unavailable"} · {selectedDate === today ? "Today" : formatDate(selectedDate)}</Typography>
        </Box>
      </Box> : <><StepHeading>{selectedDate === today ? "Today’s sky" : `Sky for ${formatDate(selectedDate)}`}</StepHeading><Typography role="status" level="body-sm" sx={{ mt: 1 }}>Moon details aren’t available for this day. Try again, or browse another date.</Typography></>}
      {!user?.birthday ? <Box sx={{ mt: 2 }}><Typography level="body-sm">Add a birthday for your optional sun-sign horoscope.</Typography><Button variant="plain" onClick={() => dispatch(openProfileModal())} sx={{ minHeight: 44, px: 0 }}>Add birthday</Button></Box>
        : <Box sx={{ mt: 1.5 }}><SunSignReading zodiac={zodiac} loading={zodiacLoading} horoscope={horoscope} horoscopeLoading={!horoscope && !horoscopeUnavailable} unavailable={horoscopeUnavailable} description={referenceData?.zodiacSigns.find((sign) => sign.key.toLowerCase() === zodiac?.sign.toLowerCase())?.description} onRetry={() => setHoroscopeAttempt((value) => value + 1)} /></Box>}
      <NextStep label={user?.birthday ? "Next: In your chart" : "Next: Your pattern"} onClick={() => setStep(1)} />
    </> },
    ...(user?.birthday ? [{ title: "In your chart", summary: selectedDay?.moonSign ? `Moon in ${selectedDay.moonSign}` : "Optional", content: <>
      <StepHeading>In your chart</StepHeading>
      {birthDetailsSaved ? <BirthChartReading enabled selectedMoonSign={selectedDay?.moonSign} />
        : <Box sx={{ mt: 1 }}><Typography level="body-sm">Your sun sign is {zodiac?.sign ?? "available from your saved birthday"}. Birth time and place are optional and help calculate more placements.</Typography><Button variant="plain" onClick={() => dispatch(openProfileModal())} sx={{ minHeight: 44, px: 0 }}>Add birth details</Button></Box>}
      <NextStep label="Next: Your pattern" onClick={() => setStep(2)} />
    </> }] : []),
    { title: "Your pattern", summary: selectedDay ? `${selectedDay.entryCount} ${selectedDay.entryCount === 1 ? "mood" : "moods"} logged` : "Mood counts", content: <>
      <StepHeading>Your pattern</StepHeading>
      <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>Moods logged during {selectedDay?.phase ?? "this moon phase"} on {formatDate(selectedDate)}.</Typography>
      {loading ? <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}><CircularProgress size="sm" /><Typography level="body-xs">Loading your mood counts…</Typography></Box>
        : unavailable ? <Box sx={{ mt: 1 }}><Typography role="status" level="body-sm">Moon and mood details are unavailable right now.</Typography><Button variant="plain" onClick={() => setAttempt((value) => value + 1)} sx={{ minHeight: 44, px: 0 }}>Try again</Button></Box>
          : selectedDay && selectedDay.entryCount > 0 ? <Box component="ul" aria-label={`Moods logged during ${selectedDay.phase ?? "the selected moon phase"}`} sx={{ listStyle: "none", p: 0, m: 0, mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {Object.entries(selectedDay.moodCounts).map(([mood, count]) => <Box component="li" key={mood}><Typography level="body-sm">{formatMood(mood)} · {count}</Typography></Box>)}
          </Box> : <Typography level="body-sm" sx={{ mt: 1 }}>No moods logged for this day yet. Choose a mood below to log it.</Typography>}
      <Box role="group" aria-label="Log a mood for the selected day" sx={{ display: "flex", flexWrap: "wrap", gap: .75, mt: 1.5 }}>
        {moods.map((mood) => {
          const aura = referenceData?.auras.find((item) => item.key === mood.auraColorKeys[0]);
          return <MoodChoiceButton key={mood.key} label={mood.displayName} icon={mood.icon} color={aura?.shades?.[500] ?? aura?.baseHex ?? "var(--al-theme-primary)"} disabled={savingMood !== null} onClick={() => void saveMood(mood.key)} />;
        })}
      </Box>
      {savingMood && <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Logging {savingMood}…</Typography>}
      {moodSaveError && <Typography role="alert" level="body-sm" sx={{ mt: 1 }}>That mood didn’t save. Choose it again to retry.</Typography>}
      <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>These are recorded counts, not evidence that the moon caused a mood.</Typography>
      <Box sx={{ mt: 2 }}><InsightFeedback pathway="energy" moduleKey="daily-astrology" insightType="moon-phase" hideContentWhenNotForMe>
        <PathwayReflectionPrompt pathway="energy" moduleKey="daily-astrology" insightType="moon-phase" prompt="What, if anything, do these counts bring up for you?" />
      </InsightFeedback></Box>
    </> },
  ];

  // The page h1 and the open step already name this module, so the section title is for screen readers only
  // and the visible check-in starts at the moon strip, keeping the open step within one screen.
  // Keep the 30-day min-content strip inside this section; only the strip may scroll horizontally.
  return <Box component="section" aria-labelledby="moon-moods-title" sx={{ minWidth: 0, width: "100%", overflow: "hidden" }}>
    <Typography id="moon-moods-title" component="h2" sx={visuallyHidden}>Today’s sky: a date-by-date path through the moon, your chart, and moods you choose to log</Typography>
    <Box ref={strip} role="group" aria-label="Moon cycle, last 30 days" sx={{ display: "flex", minWidth: 0, maxWidth: "100%", overflowX: "auto", gap: .25, py: .5, scrollSnapType: "x mandatory" }}>
      {dates.map((date, index) => {
        const day = cycle.find((item) => item.date === date);
        const loggedMoods = Object.entries(day?.moodCounts ?? {}).flatMap(([key, count]) => Array.from({ length: count }, () => key));
        const moodNames = [...new Set(loggedMoods)].map(formatMood);
        const label = `${formatDate(date)}, ${day?.phase ?? "moon phase unavailable"}, ${day?.entryCount ?? 0} ${day?.entryCount === 1 ? "mood" : "moods"} logged${moodNames.length ? `: ${moodNames.join(", ")}` : ""}`;
        const moodDots = loggedMoods.flatMap((key) => {
          const definition = referenceData?.moods.find((mood) => mood.key.toLowerCase() === key.toLowerCase());
          const aura = definition && referenceData?.auras.find((item) => item.key === definition.auraColorKeys[0]);
          const color = aura?.shades?.[500] ?? aura?.baseHex;
          return color ? [{ key, color }] : [];
        });
        return <Button key={date} ref={(element) => { dayButtons.current[index] = element; }} variant={date === selectedDate ? "soft" : "plain"} color="neutral" aria-label={label} aria-pressed={date === selectedDate} onClick={() => selectDay(date)} onKeyDown={(event) => onDayKeyDown(event, index)} sx={{ flex: "0 0 48px", minWidth: 48, minHeight: 52, p: .25, display: "flex", flexDirection: "column", gap: .25, scrollSnapAlign: "center", color: "var(--al-theme-ink)", border: "1px solid", borderColor: date === selectedDate ? "var(--al-theme-focus)" : "transparent", "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } }}>
          {day?.phase ? <MoonPhaseDisc phase={day.phase} size={24} /> : <Box aria-hidden sx={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid var(--al-theme-border)" }} />}
          <Typography component="span" level="body-xs" sx={{ color: "inherit", fontWeight: date === today ? 700 : undefined }}>{date === today ? "Today" : new Date(`${date}T12:00:00`).getDate()}</Typography>
          {moodDots.length > 0 && <Box aria-hidden sx={{ display: "flex", gap: .25, alignItems: "center" }}>
            {moodDots.slice(0, 8).map((dot, dotIndex) => <Box key={`${dot.key}-${dotIndex}`} data-testid="moon-cycle-mood-dot" sx={{ width: 4, height: 4, flexShrink: 0, borderRadius: "50%", bgcolor: dot.color }} />)}
            {moodDots.length > 8 && <Typography component="span" level="body-xs" sx={{ color: "var(--al-theme-ink)", fontSize: "8px", lineHeight: 1 }}>+{moodDots.length - 8}</Typography>}
          </Box>}
        </Button>;
      })}
    </Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 1.5, color: "var(--al-theme-ink-muted)" }}>
      <Typography level="body-xs" sx={{ color: "inherit" }}>‹ Earlier days</Typography>
      <Typography level="body-xs" sx={{ color: "inherit", textAlign: "right" }}>Dots are moods you logged</Typography>
    </Box>
    {loading && <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}><CircularProgress size="sm" /><Typography level="body-xs">Loading the moon cycle…</Typography></Box>}
    {prefetching && !loading && <Typography role="status" level="body-xs" sx={{ mb: 1 }}>Filling in older moon dates…</Typography>}
    {unavailable && <Typography role="status" level="body-sm" sx={{ mb: 1 }}>Some moon details may be unavailable. You can still select dates and review your saved chart and moods.</Typography>}
    {/* On wide screens a summary keeps the selected day's moon in view while Alex moves between steps. */}
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 220px" }, gap: 4, alignItems: "start", minWidth: 0 }}>
      <PathwaySteps label="Today's sky path" steps={steps} current={Math.min(step, stepCount - 1)} onStepChange={setStep} />
      {/* This is a named complementary summary, so its duplicate moon facts can be deliberately revisited by landmark navigation. */}
      {selectedDay?.phase && <Box component="aside" aria-label="Selected day's moon summary" sx={{ display: { xs: "none", lg: "block" }, position: "sticky", top: 24, pl: 3, borderLeft: "1px solid var(--al-theme-border)", textAlign: "center", color: "var(--al-theme-ink-muted)" }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}><MoonPhaseDisc phase={selectedDay.phase} size={84} /></Box>
        <Typography level="title-sm" sx={{ color: "var(--al-theme-ink)" }}>{selectedDay.phase}</Typography>
        <Typography level="body-xs" sx={{ color: "inherit" }}>{selectedDay.moonSign ? `in ${selectedDay.moonSign}` : "Moon sign unavailable"}{selectedDay.illumination !== null ? ` · ${Math.round(selectedDay.illumination * 100)}% lit` : ""}</Typography>
        <Typography level="body-xs" sx={{ mt: 1.5, color: "inherit" }}>{selectedDay.entryCount} {selectedDay.entryCount === 1 ? "mood" : "moods"} logged {selectedDate === today ? "today" : `on ${formatDate(selectedDate)}`}</Typography>
      </Box>}
    </Box>
  </Box>;
}

/** Moves the path forward from the end of a step, so progress never depends on finding the rail. */
function NextStep({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button onClick={onClick} sx={{ mt: 2, minHeight: 44, borderRadius: "xl", "&:focus-visible": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 3 } }}>{label} →</Button>;
}

/** Hides text visually while keeping it in the accessibility tree. Pixel units preserve the one-pixel clipped box. */
const visuallyHidden = { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap" } as const;

/** Formats dates with the device's local calendar without shifting them through UTC. */
function localDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

/** Gives each strip date an accessible month and day label. */
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`)); }

/** Formats database mood keys without assuming that their names encode a category. */
function formatMood(key: string) { return key.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
