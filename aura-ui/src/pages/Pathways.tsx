import { useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Typography from "@mui/joy/Typography";
import { useParams } from "react-router-dom";
import AccessibilityNewRounded from "@mui/icons-material/AccessibilityNewRounded";
import IconButton from "@mui/joy/IconButton";
import { ThemeBanner } from "@/components/ui/ThemeBanner";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openProfileModal } from "@/store/slices/uiSlice";
import { FAITH_RESOURCES, PATHWAY_MODULES, pathwayModuleKey } from "@/features/pathways/pathwayResources";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useGetAllMoodsQuery } from "@/store/moodApi";
import type { MoodEntry } from "@/features/mood/models/schema";
import { MindfulPracticeLog } from "@/features/pathways/components/MindfulPracticeLog";
import { FaithPracticeCheckIn } from "@/features/pathways/components/FaithPracticeCheckIn";
import { InsightFeedback } from "@/features/pathways/components/InsightFeedback";
import { MoonPhaseMoodInsights } from "@/features/pathways/components/MoonPhaseMoodInsights";
import { getDailyHoroscope, type DailyHoroscope } from "@/features/pathways/astrologyApi";
import { BirthChartReading } from "@/features/pathways/components/BirthChartReading";
import { SacredTextView } from "@/features/pathways/components/SacredTextView";

/** Shows content for the single pathway configured in Profile → My Pathway. */
export default function Pathways() {
  const { moduleKey } = useParams();
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const pathway = pathwayModuleKey(user?.selectedPathway);
  const preferences = user?.pathwayPreferences;
  const focus = preferences?.focus ?? [];
  const [selectedChakra, setSelectedChakra] = useState("");
  const [dailyHoroscope, setDailyHoroscope] = useState<DailyHoroscope | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [horoscopeUnavailable, setHoroscopeUnavailable] = useState(false);
  const hasZodiac = focus.includes("daily-astrology") || focus.includes("my-sign");
  const { data: zodiac, isLoading: zodiacLoading } = useGetZodiacInsightQuery(undefined, { skip: !hasZodiac });
  const chakraEnabled = pathway === "energy" && (focus.includes("chakra-reference") || focus.includes("chakras"));
  const { data: referenceData, isLoading: chakraLoading, isError: chakraError } = useGetReferenceDataQuery(undefined, { skip: !chakraEnabled });
  const chakras = referenceData?.chakras ?? [];
  const chakraMoodPeriod = getRecentLocalDateRange(14);
  const { data: moodData } = useGetAllMoodsQuery(chakraMoodPeriod, { skip: !chakraEnabled });
  // moodApi's hook is loosely typed on master; pin the entry shape this view relies on.
  const recentMoods: MoodEntry[] = moodData ?? [];
  const chakraMoodInsight = chakras.map((chakra) => {
    const associatedMoods = new Set(chakra.moodAssociationKeys.map((key) => key.toLowerCase()));
    const matchingDays = new Set(recentMoods
      .filter((entry) => entry.moods.some((mood) => associatedMoods.has(mood.toLowerCase())))
      .map((entry) => entry.date));
    return { chakra, matchingDayCount: matchingDays.size };
  }).filter((candidate) => candidate.matchingDayCount >= 3)
    .sort((left, right) => right.matchingDayCount - left.matchingDayCount)[0];
  const currentChakra = chakras.find((chakra) => chakra.key === selectedChakra) ?? chakras[0];
  const chakraSymbol = currentChakra && referenceData?.graphics.find((graphic) => graphic.key === currentChakra.symbolAssetKey);
  const selectedChakraColor = currentChakra && referenceData?.auras.find((aura) => aura.chakraKey === currentChakra.key);
  const faithTradition = preferences?.faithTradition ?? null;
  const faithResource = FAITH_RESOURCES.find((resource) => resource.key === faithTradition);
  const activeModule = pathway && moduleKey
    ? PATHWAY_MODULES[pathway].find((module) => module.key === moduleKey && focus.includes(module.key))
    : undefined;
  const invalidModuleRoute = Boolean(moduleKey && !activeModule);
  const showModule = (key: string) => !moduleKey || moduleKey === key;

  useEffect(() => {
    if (!hasZodiac || !user?.birthday) {
      setDailyHoroscope(null);
      setHoroscopeUnavailable(false);
      return;
    }

    let active = true;
    setHoroscopeLoading(true);
    setHoroscopeUnavailable(false);
    void getDailyHoroscope()
      .then((reading) => { if (active) setDailyHoroscope(reading); })
      .catch(() => { if (active) setHoroscopeUnavailable(true); })
      .finally(() => { if (active) setHoroscopeLoading(false); });
    return () => { active = false; };
  }, [hasZodiac, user?.birthday]);

  useEffect(() => {
    if (chakras.length > 0 && !chakras.some((chakra) => chakra.key === selectedChakra))
      setSelectedChakra(chakras[0].key);
  }, [chakras, selectedChakra]);

  const pageTitle = pathway === "mindfulness" ? "Mindful Living"
    : pathway === "energy" ? "Astrology & Energy"
      : pathway === "faith" ? "Faith & Religion" : "Your pathway";

  return <Box className="signed-in-content" sx={{ maxWidth: 960, mx: "auto" }}>
    <ThemeBanner title={pageTitle} description="Explore the modules you chose. Keep what feels useful; leave the rest." illustration={pathway === "energy" ? "aura" : pathway === "faith" ? "journal" : "insights"} />

    {invalidModuleRoute && <Box role="status" sx={{ py: 2 }}>
      <Typography level="title-md">This module is turned off.</Typography>
      <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Choose a module in Profile settings to add it to your pathway.</Typography>
      <Button size="sm" variant="plain" onClick={() => dispatch(openProfileModal())}>Profile settings</Button>
    </Box>}

    {pathway === "mindfulness" && !invalidModuleRoute && <Box sx={{ display: "grid", gap: 1 }}>
      {focus.includes("mindfulness-guide") && showModule("mindfulness-guide") && <Box component="section" id="mindfulness-guide" aria-labelledby="mindfulness-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="mindfulness-title" component="h2" level="title-lg">A practical guide to mindfulness</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mt: 1.5 }}>
          <GuideItem title="Notice now" text="Bring attention to what is here: thoughts, sensations, feelings, or surroundings." />
          <GuideItem title="Without judgment" text="Name what you notice without immediately deciding it is good or bad." />
          <GuideItem title="Return gently" text="When attention wanders, noticing and returning is part of the practice." />
        </Box>
        <Typography level="body-sm" sx={{ mt: 2 }}><strong>DBT mindfulness lens:</strong> Observe, Describe, Participate; practice Nonjudgmentally, One-Mindfully, and Effectively. Wise Mind is a DBT teaching that makes room for emotion and reason.</Typography>
        <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>An educational overview, not therapy.</Typography>
        <InsightFeedback pathway="mindfulness" moduleKey="mindfulness-guide" insightType="mindfulness-concept" />
      </Box>}
      {focus.includes("practice-log") && showModule("practice-log") && <Box component="section" id="practice-log" aria-labelledby="practice-log-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="practice-log-title" component="h2" level="title-lg">Practice log</Typography>
        <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>A personal record of what you tried, without scores or streaks.</Typography>
        <MindfulPracticeLog />
      </Box>}
    </Box>}

    {pathway === "energy" && !invalidModuleRoute && <Box sx={{ display: "grid", gap: 1 }}>
      {hasZodiac && showModule("daily-astrology") && <Box component="section" id="daily-astrology" aria-labelledby="zodiac-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="zodiac-title" component="h2" level="title-lg">Daily astrology</Typography>
        {!user?.birthday ? <Typography level="body-sm" sx={{ mt: 1 }}>Share a birthday in Profile settings for a sun-sign reflection. It’s optional. <Button size="sm" variant="plain" onClick={() => dispatch(openProfileModal())}>Profile settings</Button></Typography>
          : zodiacLoading ? <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Loading your sign…</Typography>
            : zodiac ? <><Typography level="title-md" sx={{ mt: 1, textTransform: "capitalize" }}>{zodiac.sign} · {zodiac.element}</Typography>
              {horoscopeLoading ? <Typography role="status" level="body-sm" sx={{ mt: .75 }}>Loading today’s reading…</Typography>
                : dailyHoroscope ? <><Typography level="body-md" sx={{ mt: .75 }}>{dailyHoroscope.text}</Typography><Typography level="body-xs" color="neutral" sx={{ mt: .75 }}>Daily horoscope · {dailyHoroscope.provider} · {dailyHoroscope.date}</Typography><Typography level="body-xs" color="neutral" sx={{ mt: .25 }}>A reflective lens, not a prediction or explanation of your mood.</Typography></>
                  : horoscopeUnavailable ? <Typography role="status" level="body-sm" sx={{ mt: .75 }}>Today’s reading is unavailable right now.</Typography> : null}</>
              : <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Your sign reflection is unavailable right now.</Typography>}
        {zodiac && <InsightFeedback pathway="energy" moduleKey="daily-astrology" insightType="horoscope" />}
        {preferences?.saveBirthDetails && preferences.birthTime && preferences.birthPlace
          ? <BirthChartReading enabled={Boolean(user?.birthday)} />
          : <MiniFeature title="Birth chart" text="Save birth time and place in Profile for an optional chart." />}
        <MoonPhaseMoodInsights />
      </Box>}
      {(focus.includes("chakra-reference") || focus.includes("chakras")) && showModule("chakra-reference") ? <Box component="section" id="chakra-reference" aria-labelledby="chakra-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="chakra-title" component="h2" level="title-lg">Chakra & color reference</Typography>
        <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>A commonly used seven-center map. Names, locations, and color pairings vary across traditions and modern sources.</Typography>
        {chakraLoading ? <Typography role="status" level="body-sm" sx={{ mt: 1.5 }}>Loading chakra reference…</Typography>
          : chakraError ? <Typography role="status" level="body-sm" sx={{ mt: 1.5 }}>Chakra reference is unavailable right now.</Typography>
            : currentChakra ? <>
              <FormControl sx={{ mt: 1.5, maxWidth: 320 }}><FormLabel>Explore a center</FormLabel><Select value={currentChakra.key} onChange={(_, value) => value !== null && setSelectedChakra(value)}>
                {chakras.map((chakra) => <Option key={chakra.key} value={chakra.key}>{chakra.displayName} · {chakra.sanskritName}</Option>)}
              </Select></FormControl>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "104px 1fr", sm: "150px 1fr" }, alignItems: "start", gap: { xs: 1.5, sm: 2.5 }, mt: 2 }}>
                <Box role="group" aria-label="Seven chakra centers along a human figure" sx={{ position: "relative", width: { xs: 104, sm: 140 }, height: { xs: 280, sm: 340 }, justifySelf: "center" }}>
                  <AccessibilityNewRounded aria-hidden="true" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", color: "text.primary", opacity: .2 }} />
                  {chakras.map((chakra, index) => {
                    const color = referenceData?.auras.find((aura) => aura.chakraKey === chakra.key)?.baseHex ?? "currentColor";
                    const top = chakras.length < 2 ? 50 : 8 + (chakras.length - index - 1) * (74 / (chakras.length - 1));
                    return <IconButton key={chakra.key} size="sm" variant="plain" aria-label={`Select ${chakra.displayName} chakra`} aria-pressed={currentChakra.key === chakra.key} onClick={() => setSelectedChakra(chakra.key)} sx={{ position: "absolute", zIndex: 1, left: "50%", top: `${top}%`, transform: "translate(-50%, -50%)", width: 44, height: 44, p: 0, color, borderRadius: "50%", bgcolor: "transparent", "&::after": { content: '""', position: "absolute", width: 14, height: 14, borderRadius: "50%", bgcolor: color, border: "2px solid var(--al-theme-surface)", boxShadow: currentChakra.key === chakra.key ? "0 0 0 3px var(--al-theme-focus)" : "none" }, "&:hover": { bgcolor: "var(--aura-wash)" } }} />;
                  })}
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: .75 }}>
                    {chakraSymbol && <Box component="img" src={chakraSymbol.path} alt={chakraSymbol.alternativeText} sx={{ width: 36, height: 36, objectFit: "contain" }} />}
                    <Typography level="title-md">{currentChakra.displayName} · {currentChakra.sanskritName}</Typography>
                  </Box>
                  <Typography level="body-sm" color="neutral" sx={{ display: "flex", alignItems: "center", gap: .6, mt: .35 }}><Box aria-hidden="true" sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: selectedChakraColor?.baseHex ?? "currentColor" }} />{currentChakra.bodyLocation} · {currentChakra.colorAssociation}{currentChakra.elementAssociation ? ` · ${currentChakra.elementAssociation}` : ""}</Typography>
                  <Typography level="body-sm" sx={{ mt: .75 }}>{currentChakra.description} {currentChakra.interpretiveTheme}.</Typography>
                  <Typography level="body-xs" color="neutral" sx={{ mt: .75 }}>Contemporary psychological pairing: {currentChakra.challengeAssociation}.</Typography>
                </Box>
              </Box>
              <Typography level="body-md" sx={{ mt: 1.25 }}>{currentChakra.reflectionPrompt}</Typography>
              <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>One interpretive lens; not a diagnosis or universal teaching.</Typography>
              <InsightFeedback pathway="energy" moduleKey="chakra-reference" insightType="chakra-theme" />
              {chakraMoodInsight && <Box component="aside" aria-label="Optional mood and chakra reflection" sx={{ mt: 2, pt: 1.25, borderTop: "1px solid var(--al-theme-border)" }}>
                <InsightFeedback pathway="energy" moduleKey="chakra-reference" insightType="chakra-mood-pattern" hideContentWhenNotForMe>
                <>
                <Typography level="title-sm">A pattern to explore</Typography>
                <Typography level="body-sm" sx={{ mt: .5 }}>You logged {chakraMoodInsight.chakra.moodAssociationKeys.map((key) => referenceData?.moods.find((mood) => mood.key.toLowerCase() === key.toLowerCase())?.displayName ?? key.toLowerCase()).join(" or ")} on {chakraMoodInsight.matchingDayCount} different days in the past two weeks. Would the {chakraMoodInsight.chakra.interpretiveTheme.toLowerCase()} theme associated with {chakraMoodInsight.chakra.displayName} · {chakraMoodInsight.chakra.sanskritName} connect with your experience?</Typography>
                <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>These entries may simply coincide. You decide whether the connection is meaningful.</Typography>
                </>
                </InsightFeedback>
              </Box>}
            </> : <Typography role="status" level="body-sm" sx={{ mt: 1.5 }}>No chakra references are available yet.</Typography>}
      </Box> : null}
    </Box>}

    {pathway === "faith" && !invalidModuleRoute && <Box sx={{ display: "grid", gap: 1 }}>
      {(focus.includes("sacred-texts") || focus.includes("verse")) && showModule("sacred-texts") ? <Box component="section" id="sacred-texts" aria-labelledby="sacred-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="sacred-title" component="h2" level="title-lg">Sacred texts</Typography>
        <SacredTextView framework={faithResource?.key} publisher={faithResource} />
        <InsightFeedback pathway="faith" moduleKey="sacred-texts" insightType="word-of-day" />
      </Box> : null}
      {focus.includes("faith-practice-check-in") && showModule("faith-practice-check-in") && <Box component="section" id="faith-practice-check-in" aria-labelledby="faith-practice-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="faith-practice-title" component="h2" level="title-lg">Faith practice check-in</Typography>
        <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Choose the practices you want to track. No score or streak.</Typography>
        <FaithPracticeCheckIn />
        <InsightFeedback pathway="faith" moduleKey="faith-practice-check-in" insightType="faith-practice" />
      </Box>}
    </Box>}
  </Box>;
}

/** A compact mindfulness concept used in the pathway guide. */
function GuideItem({ title, text }: { title: string; text: string }) {
  return <Box><Typography level="title-sm">{title}</Typography><Typography level="body-sm" color="neutral" sx={{ mt: .4 }}>{text}</Typography></Box>;
}

/** Small supporting panel for the astrology page's chart and moon insights. */
function MiniFeature({ title, text }: { title: string; text: string }) {
  return <Box component="section" sx={{ mt: 1.5, pt: 1.25, borderTop: "1px solid var(--al-theme-border)" }}><Typography level="title-sm">{title}</Typography><Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>{text}</Typography></Box>;
}

/** Uses local calendar dates so the two-week pattern window matches the user's journal days. */
function getRecentLocalDateRange(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const toDateOnly = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
}
