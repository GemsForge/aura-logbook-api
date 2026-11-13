import { useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import { useParams } from "react-router-dom";
import { MindfulnessGuide } from "@/features/pathways/components/MindfulnessGuide";
import { SunSignReading } from "@/features/pathways/components/SunSignReading";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openProfileModal } from "@/store/slices/uiSlice";
import { FAITH_RESOURCES, PATHWAY_MODULES, pathwayModuleKey, resolvePathwayFocus } from "@/features/pathways/pathwayResources";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { MindfulPracticeLog } from "@/features/pathways/components/MindfulPracticeLog";
import { FaithPracticeCheckIn } from "@/features/pathways/components/FaithPracticeCheckIn";
import { MoonPhaseMoodInsights } from "@/features/pathways/components/MoonPhaseMoodInsights";
import { getDailyHoroscope, type DailyHoroscope } from "@/features/pathways/astrologyApi";
import { BirthChartReading } from "@/features/pathways/components/BirthChartReading";
import { SacredTextView } from "@/features/pathways/components/SacredTextView";
import { useDailyPathwayReflection } from "@/features/pathways/useDailyPathwayReflection";
import { ChakraReference } from "@/features/pathways/components/ChakraReference";
import "@/features/pathways/pathwayStudio.css";
import { MoodPathwayReflectionPanel } from "@/features/pathways/components/MoodPathwayReflectionPanel";


/** Composes illustrated, interactive modules for the one profile-selected pathway and enabled routes. */
export default function Pathways() {
  const { moduleKey } = useParams();
  const dailyReflection = useDailyPathwayReflection();
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const pathway = pathwayModuleKey(user?.selectedPathway);
  const preferences = user?.pathwayPreferences;
  const focus = resolvePathwayFocus(user?.selectedPathway, preferences?.focus);
  const [dailyHoroscope, setDailyHoroscope] = useState<DailyHoroscope | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [horoscopeUnavailable, setHoroscopeUnavailable] = useState(false);
  const hasZodiac = focus.includes("daily-astrology") || focus.includes("my-sign");
  const { data: zodiac, isLoading: zodiacLoading } = useGetZodiacInsightQuery(undefined, { skip: !hasZodiac });
  const { data: referenceData } = useGetReferenceDataQuery(undefined, { skip: pathway !== "energy" });
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

  const pageTitle = pathway === "mindfulness" ? "Mindful Living"
    : pathway === "energy" ? "Astrology & Energy"
      : pathway === "faith" ? "Faith & Religion" : "Your pathway";

  return <Box className="signed-in-content pathway-studio" sx={{ maxWidth: 1200, mx: "auto" }}>
    <Box component="header" sx={{ mb: 3, py: 1 }}>
      <Typography component="h1" level="h1" sx={{ fontFamily: "var(--joy-fontFamily-display)", fontWeight: 500, mt: 1 }}>{pathway === "energy" ? (moduleKey === "chakra-reference" ? "Chakra & color reference" : "Your sky") : pathway === "mindfulness" ? (moduleKey === "practice-log" ? "A little practice, your way" : "Mindful living") : pathway === "faith" ? (moduleKey === "faith-practice-check-in" ? "Your practice, your pace" : "A moment with meaning") : pageTitle}</Typography>
      <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>{pathway === "energy" ? (moduleKey === "chakra-reference" ? "Seven centers. Many ways to reflect." : "Your horoscope, chart, and moods across the moon’s phases.") : pathway === "mindfulness" ? "Explore a skill. Try a moment. Return when you’re ready." : "Make room for what matters to you."}</Typography>
    </Box>

    {invalidModuleRoute && <Box role="status" sx={{ py: 2 }}>
      <Typography level="title-md">This module is turned off.</Typography>
      <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Choose a module in Profile settings to add it to your pathway.</Typography>
      <Button size="sm" variant="plain" onClick={() => dispatch(openProfileModal())}>Profile settings</Button>
    </Box>}

    {pathway === "mindfulness" && !invalidModuleRoute && <Box sx={{ display: "grid", gap: 1 }}>
      {focus.includes("mindfulness-guide") && showModule("mindfulness-guide") && <MindfulnessGuide breathingEnabled={preferences?.breathingEnabled !== false} practiceLogEnabled={focus.includes("practice-log")} />}
      {focus.includes("practice-log") && showModule("practice-log") && <Box component="section" id="practice-log" aria-labelledby="practice-log-title" sx={{ py: 2, minWidth: 0 }}>
        <Typography id="practice-log-title" component="h2" level="title-lg">Practice log</Typography>

        <MindfulPracticeLog />
      </Box>}
    </Box>}

    {pathway === "energy" && !invalidModuleRoute && <Box sx={{ display: "grid", gap: 1 }}>
      {hasZodiac && showModule("daily-astrology") && <Box component="section" id="daily-astrology" aria-labelledby="zodiac-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="zodiac-title" component="h2" level="title-lg" sx={{ mb: 2, display: moduleKey ? "none" : "block" }}>Daily astrology</Typography>
        <Box sx={{ minWidth: 0 }}>
          {!user?.birthday ? <Box className="aura-highlight" sx={{ p: 3, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}><Typography level="body-sm">Share a birthday for your sun-sign reading. It’s optional.</Typography><Button size="sm" variant="plain" onClick={() => dispatch(openProfileModal())}>Profile settings</Button></Box>
            : <SunSignReading zodiac={zodiac} loading={zodiacLoading} horoscope={dailyHoroscope} horoscopeLoading={horoscopeLoading} unavailable={horoscopeUnavailable} description={referenceData?.zodiacSigns.find((sign) => sign.key.toLowerCase() === zodiac?.sign.toLowerCase())?.description} />}
        </Box>
        <Box data-testid="astrology-reading-grid" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.2fr) minmax(0, 1fr)" }, gap: { xs: 3, md: 4 }, mt: 3, pt: 3, borderTop: "1px solid var(--al-theme-border)", alignItems: "start" }}>
          <Box sx={{ minWidth: 0 }}>
            {preferences?.saveBirthDetails && preferences.birthTime && preferences.birthPlace
              ? <BirthChartReading enabled={Boolean(user?.birthday)} />
              : <MiniFeature title="Birth chart" text="Save birth time and place for an optional chart." />}
            <Button size="sm" variant="plain" sx={{ mt: 1, px: 1, py: .25, minHeight: 44 }} onClick={() => dispatch(openProfileModal())}>Birth details settings</Button>
          </Box>
          <MoonPhaseMoodInsights />
        </Box>
        {/* The shared mood invitation remains available without competing with the day's reading. */}
        <Box component="details" className="pathway-disclosure" sx={{ mt: 3 }}>
          <Box component="summary">Reflect with a mood check-in</Box>
          <MoodPathwayReflectionPanel reflection={dailyReflection.reflection} loading={dailyReflection.loading} />
          <Link href="/log-mood" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, mt: 1 }}>Add this reflection to a mood check-in</Link>
        </Box>
      </Box>}
      {(focus.includes("chakra-reference") || focus.includes("chakras")) && showModule("chakra-reference") && <ChakraReference />}

    </Box>}

    {pathway === "faith" && !invalidModuleRoute && <Box sx={{ display: "grid", gap: 1 }}>
      {(focus.includes("sacred-texts") || focus.includes("verse")) && showModule("sacred-texts") ? <Box id="sacred-texts" sx={{ py: 2 }}>
        <SacredTextView framework={faithResource?.key} publisher={faithResource} />
      </Box> : null}
      {focus.includes("faith-practice-check-in") && showModule("faith-practice-check-in") && <Box className="aura-highlight" component="section" id="faith-practice-check-in" aria-labelledby="faith-practice-title" sx={{ p: 2.5, my: 1, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
        <Typography id="faith-practice-title" component="h2" level="title-lg">Faith practice check-in</Typography>
        <FaithPracticeCheckIn />
      </Box>}
    </Box>}
  </Box>;
}

/** Small supporting panel for the astrology page's chart and moon insights. */
function MiniFeature({ title, text }: { title: string; text: string }) {
  return <Box component="section" sx={{ minWidth: 0 }}><Typography level="title-sm">{title}</Typography><Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>{text}</Typography></Box>;
}
