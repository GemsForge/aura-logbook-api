import { useEffect, useMemo, useState } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import { useParams } from "react-router-dom";
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
import { useDailyPathwayReflection } from "@/features/pathways/useDailyPathwayReflection";
import { MoodPathwayReflectionPanel } from "@/features/pathways/components/MoodPathwayReflectionPanel";
import { PathwayReflectionPrompt } from "@/features/pathways/components/PathwayReflectionPrompt";

import { CHAKRA_BODY_MAP_TOP } from "@/features/pathways/chakraReference";

/** Arranges enabled modules in the approved editorial layouts, using the selected profile pathway. */
export default function Pathways() {
  const { moduleKey } = useParams();
  const dailyReflection = useDailyPathwayReflection();
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
    {pathway === "energy" ? <Box component="header" sx={{ mb: 3, py: 1 }}>
      <Typography level="body-xs" sx={{ letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600 }}>Astrology & Energy · {moduleKey === "chakra-reference" ? "Wiki reference" : "Daily reflection"}</Typography>
      <Typography component="h1" level="h1" sx={{ fontFamily: "var(--joy-fontFamily-display)", fontWeight: 500, fontSize: { xs: "2.25rem", md: "3.5rem" }, mt: 1 }}>{moduleKey === "chakra-reference" ? "Chakra & color reference" : "Your sky, your reflection"}</Typography>
      <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>{moduleKey === "chakra-reference" ? "A seven-center reference for locations, common themes, colors, and reflection." : "Horoscope, birth chart, and moon insights. Decide what feels meaningful."}</Typography>
    </Box> : <ThemeBanner title={pageTitle} description="Explore the modules you chose. Keep what feels useful; leave the rest." illustration={pathway === "faith" ? "journal" : "insights"} /> }

    {invalidModuleRoute && <Box role="status" sx={{ py: 2 }}>
      <Typography level="title-md">This module is turned off.</Typography>
      <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Choose a module in Profile settings to add it to your pathway.</Typography>
      <Button size="sm" variant="plain" onClick={() => dispatch(openProfileModal())}>Profile settings</Button>
    </Box>}

    {pathway === "mindfulness" && !invalidModuleRoute && <Box sx={{ display: "grid", gap: 1 }}>
      {focus.includes("mindfulness-guide") && showModule("mindfulness-guide") && <Box component="section" id="mindfulness-guide" aria-labelledby="mindfulness-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="mindfulness-title" component="h2" level="title-lg">Mindfulness, in practice</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mt: 1.5 }}>
          <GuideItem title="Notice now" text="Bring attention to what is here: thoughts, sensations, feelings, or surroundings." />
          <GuideItem title="Without judgment" text="Name what you notice without immediately deciding it is good or bad." />
          <GuideItem title="Return gently" text="When attention wanders, noticing and returning is part of the practice." />
          <GuideItem title="Start small" text="Try one mindful breath or a few minutes. Pair it with a moment already in your day if that helps." />
          <GuideItem title="Make it your own" text="Choose a practice and rhythm that fit you. A routine can change as your days change." />
          <GuideItem title="Begin again" text="Missed days happen. Return when you’re ready; no streak or catch-up is needed." />
        </Box>
        <Box component="section" aria-labelledby="dbt-mindfulness-title" sx={{ mt: 2 }}>
          <Typography id="dbt-mindfulness-title" component="h3" level="title-md">A DBT mindfulness lens</Typography>
          <Typography level="body-sm" sx={{ mt: .5 }}>Dialectical Behavior Therapy describes three “what” skills—Observe, Describe, Participate—and three “how” skills—Nonjudgmentally, One-Mindfully, Effectively. Wise Mind is a DBT concept that makes room for emotion and reason.</Typography>
          <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>These are plain-language summaries of DBT terms, offered for learning rather than treatment.</Typography>
          <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>
            Further reading: <Link href="https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety" target="_blank" rel="noreferrer">NCCIH mindfulness overview</Link>
            {" · "}<Link href="https://www.guilford.com/books/DBT-Skills-Training-Manual/Marsha-Linehan/9781462556359" target="_blank" rel="noreferrer">Linehan’s DBT Skills Training Manual</Link>
          </Typography>
        </Box>
        <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>An educational overview, not therapy.</Typography>
        <InsightFeedback pathway="mindfulness" moduleKey="mindfulness-guide" insightType="mindfulness-concept" hideContentWhenNotForMe>
          <PathwayReflectionPrompt pathway="mindfulness" moduleKey="mindfulness-guide" insightType="mindfulness-concept" prompt="What kind of mindful moment would you like to make room for?" />
        </InsightFeedback>
      </Box>}
      {focus.includes("practice-log") && showModule("practice-log") && <Box component="section" id="practice-log" aria-labelledby="practice-log-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="practice-log-title" component="h2" level="title-lg">Practice log</Typography>
        <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>A personal record of what you tried, without scores or streaks.</Typography>
        <MindfulPracticeLog />
      </Box>}
    </Box>}

    {pathway === "energy" && !invalidModuleRoute && <Box sx={{ display: "grid", gap: 1 }}>
      {hasZodiac && showModule("daily-astrology") && <Box component="section" id="daily-astrology" aria-labelledby="zodiac-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="zodiac-title" component="h2" level="title-lg" sx={{ mb: 2, display: moduleKey ? "none" : "block" }}>Daily astrology</Typography>
        <Box data-testid="astrology-reading-grid" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.2fr) minmax(0, 1fr)" }, gap: 3 }}>
        <Box sx={{ p: 2.5, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
        {!user?.birthday ? <Typography level="body-sm" sx={{ mt: 1 }}>Share a birthday in Profile settings for a sun-sign reflection. It’s optional. <Button size="sm" variant="plain" onClick={() => dispatch(openProfileModal())}>Profile settings</Button></Typography>
          : zodiacLoading ? <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Loading your sign…</Typography>
            : zodiac ? <><Typography level="title-md" sx={{ mt: 1, textTransform: "capitalize" }}>{zodiac.sign} · {zodiac.element}</Typography>
              {horoscopeLoading ? <Typography role="status" level="body-sm" sx={{ mt: .75 }}>Loading today’s reading…</Typography>
                : dailyHoroscope ? <InsightFeedback pathway="energy" moduleKey="daily-astrology" insightType="horoscope" hideContentWhenNotForMe>
                  <>
                    <Typography component="blockquote" sx={{ m: 0, mt: 1, fontFamily: "var(--joy-fontFamily-display)", fontSize: "1.6rem", lineHeight: 1.5 }}>{dailyHoroscope.text}</Typography>
                    <Typography level="body-xs" color="neutral" sx={{ mt: .75 }}>Daily horoscope · {dailyHoroscope.provider} · {dailyHoroscope.date}</Typography>
                    <Typography level="body-xs" color="neutral" sx={{ mt: .25 }}>A reflective lens, not a prediction or explanation of your mood.</Typography>
                    <PathwayReflectionPrompt pathway="energy" moduleKey="daily-astrology" insightType="horoscope" prompt="What, if anything, would you like to carry into today?" />
                  </>
                </InsightFeedback>
                  : horoscopeUnavailable ? <Typography role="status" level="body-sm" sx={{ mt: .75 }}>Today’s reading is unavailable right now.</Typography> : null}</>
              : <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Your sign reflection is unavailable right now.</Typography>}
        </Box>
        <Box sx={{ p: 2.5, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
        {preferences?.saveBirthDetails && preferences.birthTime && preferences.birthPlace
          ? <BirthChartReading enabled={Boolean(user?.birthday)} />
          : <MiniFeature title="Birth chart" text="Save birth time and place in Profile for an optional chart." />}
        <Button size="sm" variant="plain" sx={{ mt: 1, px: 1, py: .25 }} onClick={() => dispatch(openProfileModal())}>Birth details settings</Button>
        </Box>
        </Box>
        <Box sx={{ p: 2.5, mt: 2, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}><MoonPhaseMoodInsights /></Box>
        <Box sx={{ mt: 3 }}><MoodPathwayReflectionPanel reflection={dailyReflection.reflection} loading={dailyReflection.loading} /><Link href="/log-mood" sx={{ display: "inline-block", mt: 1 }}>Add this reflection to a mood check-in</Link></Box>
      </Box>}
      {(focus.includes("chakra-reference") || focus.includes("chakras")) && showModule("chakra-reference") ? <Box component="section" id="chakra-reference" aria-labelledby="chakra-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="chakra-title" component="h2" level="title-lg" sx={{ display: moduleKey ? "none" : "block" }}>Chakra & color reference</Typography>

        {chakraLoading ? <Typography role="status" level="body-sm" sx={{ mt: 1.5 }}>Loading chakra reference…</Typography>
          : chakraError ? <Typography role="status" level="body-sm" sx={{ mt: 1.5 }}>Chakra reference is unavailable right now.</Typography>
            : currentChakra ? <>
              <Box data-testid="chakra-reference-grid" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(220px, .7fr) minmax(0, 1.6fr)" }, alignItems: "center", gap: 2.5, p: 2.5, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
                <Box role="group" aria-label="Seven chakra centers on a seated human figure" sx={{ position: "relative", width: 240, height: 300, justifySelf: "center" }}>
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
                      <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}><Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: "50%", bgcolor: referenceData?.auras.find((aura) => aura.chakraKey?.replace(/_/g, "-") === chakra.key)?.baseHex ?? "currentColor" }} />{chakra.displayName} · {chakra.sanskritName}</Box>
                      <Typography component="span" level="body-xs" color="neutral" sx={{ display: { xs: "none", md: "block" } }}>{chakra.bodyLocation}</Typography>
                    </Button>)}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.25fr) minmax(0, 1fr)" }, gap: 3, mt: 2 }}>
              <Box sx={{ p: 2.5, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {chakraSymbol && <Box component="img" src={chakraSymbol.path} alt={chakraSymbol.alternativeText} sx={{ width: 36, height: 36, objectFit: "contain" }} />}
                  <Typography component="h3" level="title-md">{currentChakra.displayName} · {currentChakra.sanskritName}</Typography>
                </Box>
                <Typography level="body-sm" sx={{ mt: 1 }}>{currentChakra.description}</Typography>
                <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>{currentChakra.bodyLocation} · {currentChakra.colorAssociation}{currentChakra.elementAssociation ? ` · ${currentChakra.elementAssociation}` : ""}</Typography>
              <InsightFeedback pathway="energy" moduleKey="chakra-reference" insightType="chakra-theme" hideContentWhenNotForMe>
                <>
                  <Typography level="body-sm" sx={{ mt: 1 }}>{currentChakra.interpretiveTheme}. Contemporary psychological pairing: {currentChakra.challengeAssociation}.</Typography>
                  <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>One interpretive lens; not a diagnosis or universal teaching.</Typography>
                  <PathwayReflectionPrompt pathway="energy" moduleKey="chakra-reference" insightType="chakra-theme" prompt={currentChakra.reflectionPrompt} />
                </>
              </InsightFeedback>
              </Box>
              <Box sx={{ p: 2.5, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
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
      {(focus.includes("sacred-texts") || focus.includes("verse")) && showModule("sacred-texts") ? <Box component="section" id="sacred-texts" aria-labelledby="sacred-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="sacred-title" component="h2" level="title-lg">Sacred texts</Typography>
        <SacredTextView framework={faithResource?.key} publisher={faithResource} />
      </Box> : null}
      {focus.includes("faith-practice-check-in") && showModule("faith-practice-check-in") && <Box component="section" id="faith-practice-check-in" aria-labelledby="faith-practice-title" sx={{ py: 2, borderBottom: "1px solid var(--al-theme-border)" }}>
        <Typography id="faith-practice-title" component="h2" level="title-lg">Faith practice check-in</Typography>
        <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>Choose the practices you want to track. No score or streak.</Typography>
        <FaithPracticeCheckIn />
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
