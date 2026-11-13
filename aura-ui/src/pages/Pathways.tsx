import { useEffect, useMemo, useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import { useParams } from "react-router-dom";
import IconButton from "@mui/joy/IconButton";
import { MindfulnessGuide } from "@/features/pathways/components/MindfulnessGuide";
import { SunSignReading } from "@/features/pathways/components/SunSignReading";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openProfileModal } from "@/store/slices/uiSlice";
import { FAITH_RESOURCES, PATHWAY_MODULES, pathwayModuleKey, resolvePathwayFocus } from "@/features/pathways/pathwayResources";
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
import { useDailyPathwayReflection } from "@/features/pathways/useDailyPathwayReflection";
import { MoodPathwayReflectionPanel } from "@/features/pathways/components/MoodPathwayReflectionPanel";
import { PathwayReflectionPrompt } from "@/features/pathways/components/PathwayReflectionPrompt";

import { CHAKRA_BODY_MAP_TOP } from "@/features/pathways/chakraReference";

/** Composes illustrated, interactive modules for the one profile-selected pathway and enabled routes. */
export default function Pathways() {
  const { moduleKey } = useParams();
  const dailyReflection = useDailyPathwayReflection();
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const pathway = pathwayModuleKey(user?.selectedPathway);
  const preferences = user?.pathwayPreferences;
  const focus = resolvePathwayFocus(user?.selectedPathway, preferences?.focus);
  const [selectedChakra, setSelectedChakra] = useState("");
  const [dailyHoroscope, setDailyHoroscope] = useState<DailyHoroscope | null>(null);
  const [horoscopeLoading, setHoroscopeLoading] = useState(false);
  const [horoscopeUnavailable, setHoroscopeUnavailable] = useState(false);
  const hasZodiac = focus.includes("daily-astrology") || focus.includes("my-sign");
  const { data: zodiac, isLoading: zodiacLoading } = useGetZodiacInsightQuery(undefined, { skip: !hasZodiac });
  const chakraEnabled = pathway === "energy" && (focus.includes("chakra-reference") || focus.includes("chakras"));
  const { data: referenceData, isLoading: chakraLoading, isError: chakraError } = useGetReferenceDataQuery(undefined, { skip: pathway !== "energy" });
  const chakras = useMemo(() => referenceData?.chakras.filter((chakra) => Object.prototype.hasOwnProperty.call(CHAKRA_BODY_MAP_TOP, chakra.key)) ?? [], [referenceData?.chakras]);
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
  const chakraBodyMap = referenceData?.graphics.find((graphic) => graphic.key === "chakra-body-map");
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

  return <Box className="signed-in-content" sx={{ maxWidth: 1200, mx: "auto" }}>
    <Box component="header" sx={{ mb: 3, py: 1 }}>
      <Typography level="body-xs" sx={{ letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600 }}>{pageTitle} · {moduleKey === "chakra-reference" ? "Wiki reference" : pathway === "mindfulness" ? "Daily practice" : "Daily reflection"}</Typography>
      <Typography component="h1" level="h1" sx={{ fontFamily: "var(--joy-fontFamily-display)", fontWeight: 500, mt: 1 }}>{pathway === "energy" ? (moduleKey === "chakra-reference" ? "Chakra & color reference" : "Your sky, your reflection") : pathway === "mindfulness" ? (moduleKey === "practice-log" ? "A little practice, your way" : "Come back to this moment") : pathway === "faith" ? (moduleKey === "faith-practice-check-in" ? "Your practice, your pace" : "A moment with meaning") : pageTitle}</Typography>
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
        <Box data-testid="astrology-reading-grid" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.2fr) minmax(0, 1fr)" }, gap: 3 }}>
        <Box className="aura-highlight" sx={{ p: 2.5, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
        {!user?.birthday ? <Typography level="body-sm" sx={{ mt: 1 }}>Share a birthday in Profile settings for a sun-sign reflection. It’s optional. <Button size="sm" variant="plain" onClick={() => dispatch(openProfileModal())}>Profile settings</Button></Typography>
          : <SunSignReading zodiac={zodiac} loading={zodiacLoading} horoscope={dailyHoroscope} horoscopeLoading={horoscopeLoading} unavailable={horoscopeUnavailable} description={referenceData?.zodiacSigns.find((sign) => sign.key.toLowerCase() === zodiac?.sign.toLowerCase())?.description} />}

        </Box>
        <Box className="aura-highlight" sx={{ p: 2.5, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
        {preferences?.saveBirthDetails && preferences.birthTime && preferences.birthPlace
          ? <BirthChartReading enabled={Boolean(user?.birthday)} />
          : <MiniFeature title="Birth chart" text="Save birth time and place in Profile for an optional chart." />}
        <Button size="sm" variant="plain" sx={{ mt: 1, px: 1, py: .25 }} onClick={() => dispatch(openProfileModal())}>Birth details settings</Button>
        </Box>
        </Box>
        <Box className="aura-highlight" sx={{ position: "relative", p: 2.5, mt: 3, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
          <Box component="img" src="/theme-assets/pathways/astrology-energy/astrology-energy-moon-phases.png" alt="" sx={{ display: "block", width: { xs: 220, sm: 300 }, maxWidth: "100%", height: { xs: 74, sm: 100 }, objectFit: "contain", mx: "auto", mb: 2 }} />
          <MoonPhaseMoodInsights />
        </Box>
        <Box sx={{ mt: 3 }}><MoodPathwayReflectionPanel reflection={dailyReflection.reflection} loading={dailyReflection.loading} /><Link href="/log-mood" sx={{ display: "inline-block", mt: 1 }}>Add this reflection to a mood check-in</Link></Box>
      </Box>}
      {(focus.includes("chakra-reference") || focus.includes("chakras")) && showModule("chakra-reference") ? <Box component="section" id="chakra-reference" aria-labelledby="chakra-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="chakra-title" component="h2" level="title-lg" sx={{ display: moduleKey ? "none" : "block" }}>Chakra & color reference</Typography>

        {chakraLoading ? <Typography role="status" level="body-sm" sx={{ mt: 1.5 }}>Loading chakra reference…</Typography>
          : chakraError ? <Typography role="status" level="body-sm" sx={{ mt: 1.5 }}>Chakra reference is unavailable right now.</Typography>
            : currentChakra ? <>
              <Box className="aura-highlight" data-testid="chakra-reference-grid" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(220px, .7fr) minmax(0, 1.6fr)" }, alignItems: "center", gap: 2.5, p: 2.5, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
                <Box role="group" aria-label="Seven chakra centers on a seated human figure" sx={{ position: "relative", width: 240, maxWidth: "100%", height: 300, justifySelf: "center", background: "radial-gradient(ellipse, var(--aura-wash), transparent 70%)" }}>
                  <Box component="img" src={chakraBodyMap?.path ?? "/theme-assets/pathways/astrology-energy/chakra-illustrations/chakra-body-map.svg"} alt={chakraBodyMap?.alternativeText ?? "Seated human silhouette with seven colored centers aligned along the spine"} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
                  {chakras.map((chakra, index) => {
                    const color = referenceData?.auras.find((aura) => aura.chakraKey?.replace(/_/g, "-") === chakra.key)?.baseHex ?? "currentColor";
                    const top = CHAKRA_BODY_MAP_TOP[chakra.key] ?? (chakras.length < 2 ? 50 : 8 + (chakras.length - index - 1) * (74 / (chakras.length - 1)));
                    return <IconButton key={chakra.key} size="sm" variant="plain" aria-label={`Select ${chakra.displayName} chakra`} aria-pressed={currentChakra.key === chakra.key} onClick={() => setSelectedChakra(chakra.key)} sx={{ position: "absolute", zIndex: 1, left: "50%", top: `${top}%`, transform: "translate(-50%, -50%)", width: 44, height: 44, p: 0, color, borderRadius: "50%", bgcolor: "transparent", "&::after": { content: '""', position: "absolute", width: 14, height: 14, borderRadius: "50%", bgcolor: color, border: "2px solid var(--al-theme-surface)", boxShadow: currentChakra.key === chakra.key ? "0 0 0 3px var(--al-theme-focus)" : "none" }, "&:hover": { bgcolor: "var(--aura-wash)" } }} />;
                  })}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography level="title-md">Seven commonly named centers</Typography>
                  <Typography level="body-xs" color="neutral" sx={{ mt: .5, mb: 1.5 }}>Select a center to explore its themes.</Typography>
                  <Box sx={{ display: "grid", gap: .75 }}>
                    {chakras.map((chakra) => <Button key={chakra.key} variant={currentChakra.key === chakra.key ? "soft" : "plain"} color="neutral" aria-pressed={currentChakra.key === chakra.key} onClick={() => setSelectedChakra(chakra.key)} sx={{ justifyContent: "space-between", textAlign: "left", color: "var(--al-theme-ink)", minHeight: 44, px: 1, py: .5, borderRadius: "sm", borderBottom: "1px solid var(--al-theme-border)", gap: 1 }}>
                      <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}><Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: "50%", bgcolor: referenceData?.auras.find((aura) => aura.chakraKey?.replace(/_/g, "-") === chakra.key)?.baseHex ?? "currentColor" }} />{referenceData?.graphics.find((asset) => asset.key === chakra.symbolAssetKey) && <Box component="img" alt="" src={referenceData.graphics.find((asset) => asset.key === chakra.symbolAssetKey)!.path} sx={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />}{chakra.displayName} · {chakra.sanskritName}</Box>
                      <Typography component="span" level="body-xs" color="neutral" sx={{ display: { xs: "none", md: "block" } }}>{chakra.bodyLocation}</Typography>
                    </Button>)}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.25fr) minmax(0, 1fr)" }, gap: 3, mt: 2 }}>
              <Box className="aura-highlight" sx={{ p: 2.5, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {chakraSymbol && <Box component="img" src={chakraSymbol.path} alt={chakraSymbol.alternativeText} sx={{ width: 36, height: 36, objectFit: "contain" }} />}
                  <Typography component="h3" level="title-md">{currentChakra.displayName} · {currentChakra.sanskritName}</Typography>
                </Box>
                <Typography level="body-sm" sx={{ mt: 1 }}>{currentChakra.description}</Typography>
                <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>{currentChakra.bodyLocation} · {currentChakra.colorAssociation}{currentChakra.elementAssociation ? ` · ${currentChakra.elementAssociation}` : ""}</Typography>
              <InsightFeedback pathway="energy" moduleKey="chakra-reference" insightType="chakra-theme" hideContentWhenNotForMe>
                <>
                  <Box component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, my: 2 }}>
                    <Box><Typography component="dt" level="body-xs" color="neutral">Associated themes</Typography><Typography component="dd" level="title-sm" sx={{ m: 0, mt: .5 }}>{currentChakra.interpretiveTheme}</Typography></Box>
                    <Box><Typography component="dt" level="body-xs" color="neutral">Challenges in this lens</Typography><Typography component="dd" level="title-sm" sx={{ m: 0, mt: .5 }}>{currentChakra.challengeAssociation}</Typography></Box>
                  </Box>
                  <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>One interpretive lens; not a diagnosis or universal teaching.</Typography>
                  <PathwayReflectionPrompt pathway="energy" moduleKey="chakra-reference" insightType="chakra-theme" prompt={currentChakra.reflectionPrompt} />
                </>
              </InsightFeedback>
              </Box>
              <Box className="aura-highlight" sx={{ p: 2.5, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
                <Typography component="h3" level="title-md">About this reference</Typography>
                <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>Common Sanskrit names and body locations meet familiar color associations and a contemporary psychological lens.</Typography>
                <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>Themes such as grounding and fear or expression and truth offer a way to reflect. You decide whether a connection is useful.</Typography>
              </Box>
              </Box>
              {chakraMoodInsight && <Box component="aside" aria-label="Optional mood and chakra reflection" sx={{ mt: 2, pt: 1.25, borderTop: "1px solid var(--al-theme-border)" }}>
                <InsightFeedback pathway="energy" moduleKey="chakra-reference" insightType="chakra-mood-pattern" hideContentWhenNotForMe>
                <>
                <Typography level="title-sm">A pattern to explore</Typography>
                <Typography level="body-sm" sx={{ mt: .5 }}>You logged {chakraMoodInsight.chakra.moodAssociationKeys.map((key) => referenceData?.moods.find((mood) => mood.key.toLowerCase() === key.toLowerCase())?.displayName ?? key.toLowerCase()).join(" or ")} on {chakraMoodInsight.matchingDayCount} different days in the past two weeks. Would the {chakraMoodInsight.chakra.interpretiveTheme.toLowerCase()} theme associated with {chakraMoodInsight.chakra.displayName} · {chakraMoodInsight.chakra.sanskritName} connect with your experience?</Typography>
                <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>These entries may simply coincide. You decide whether the connection is meaningful.</Typography>
                <PathwayReflectionPrompt pathway="energy" moduleKey="chakra-reference" insightType="chakra-mood-pattern" prompt="Would you like to note what, if anything, this pattern means to you?" />
                </>
                </InsightFeedback>
              </Box>}
            </> : <Typography role="status" level="body-sm" sx={{ mt: 1.5 }}>No chakra references are available yet.</Typography>}
      </Box> : null}
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

/** Uses local calendar dates so the two-week pattern window matches the user's journal days. */
function getRecentLocalDateRange(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const toDateOnly = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { startDate: toDateOnly(start), endDate: toDateOnly(end) };
}
