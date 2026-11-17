import { useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/joy";
import { Link as RouterLink } from "react-router-dom";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useGetAllMoodsQuery } from "@/store/moodApi";
import type { MoodEntry } from "@/features/mood/models/schema";
import { CHAKRA_BODY_MAP_TOP } from "../chakraReference";
import { chakraDaysSince, latestEntry, linkMoodsToChakras } from "../chakraMoodLink";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";

/**
 * Viewport-bounded chakra reference personalised by the user's latest check-in (#453).
 * One bordered module, two halves: the seated-body figure is the only picker (each center's own
 * symbol sits on the spine as a named button), and one detail card shows the selected center's
 * meaning. The aura connection is shown on the chakra it links to; reflection and weekly context
 * stay collapsed. Only inner regions scroll, never the page. Links come from aura `chakraKey`
 * data and are reflective only, never diagnostic.
 */
export function ChakraReference() {
  const { data, isLoading, isError, refetch } = useGetReferenceDataQuery();
  const [selectedKey, setSelectedKey] = useState("");
  const chakras = useMemo(() => data?.chakras.filter((item) => Object.prototype.hasOwnProperty.call(CHAKRA_BODY_MAP_TOP, item.key)) ?? [], [data?.chakras]);
  const period = recentDateRange();
  const { data: entries, isLoading: moodsLoading } = useGetAllMoodsQuery({ startDate: period.startDate, endDate: period.endDate });
  const moods: MoodEntry[] = useMemo(() => entries ?? [], [entries]);
  const reference = useMemo(() => ({ moods: data?.moods ?? [], auras: data?.auras ?? [], chakras }), [data?.moods, data?.auras, chakras]);
  const latest = latestEntry(moods);
  const links = useMemo(() => latest ? linkMoodsToChakras(latest.moods, reference) : [], [latest, reference]);
  const weekDays = useMemo(() => chakraDaysSince(moods, period.weekStart, reference), [moods, period.weekStart, reference]);
  const linkedKeys = new Set(links.map((link) => link.chakra.key));
  // Open on the chakra the current mood connects with; with no connection, begin at the crown.
  const current = chakras.find((item) => item.key === selectedKey) ?? links[0]?.chakra ?? chakras.find((item) => item.key === "crown") ?? chakras[0];
  const body = data?.graphics.find((item) => item.key === "chakra-body-map");
  const iconFor = (key: string, assetKey: string) => data?.graphics.find((item) => item.key === assetKey)?.path ?? `/theme-assets/pathways/astrology-energy/chakra-symbols/chakra-${key}.svg`;
  const colorAura = data?.auras.find((aura) => aura.displayName.toLowerCase() === current?.colorAssociation.toLowerCase());
  // Count distinct recorded days, never infer an energetic condition from a mood key.
  const pattern = chakras.map((chakra) => {
    const keys = new Set(chakra.moodAssociationKeys.map((key) => key.toLowerCase()));
    const days = new Set(moods.filter((entry) => entry.moods.some((key) => keys.has(key.toLowerCase()))).map((entry) => entry.date));
    return { chakra, count: days.size };
  }).filter((item) => item.count >= 3).sort((a, b) => b.count - a.count)[0];

  if (isLoading) return <Typography role="status">Loading chakra reference…</Typography>;
  if (isError) return <Box><Typography role="status">Chakra reference is unavailable right now.</Typography><Button size="sm" variant="plain" onClick={() => void refetch()}>Try again</Button></Box>;
  if (!current) return <Typography role="status">No chakra references are available yet.</Typography>;

  const currentLink = links.find((link) => link.chakra.key === current.key);
  const currentWeekDays = weekDays.get(current.key) ?? 0;

  return <Box component="section" id="chakra-reference" aria-label="Chakra reference" data-testid="chakra-reference"
    // App chrome (page header above, footer below) is ~280px on desktop and ~420px on mobile (tabs, footer, bottom-nav padding).
    sx={{ minWidth: 0, height: { xs: "auto", md: "calc(100dvh - 290px)" }, minHeight: { xs: 0, md: 240 }, p: { xs: 1, sm: 2 }, borderRadius: "md", border: "1px solid var(--al-theme-border)",
      display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(0, .9fr) minmax(0, 1.1fr)" }, gridTemplateRows: { xs: "auto auto", sm: "minmax(0, 1fr)" }, gap: { xs: 1, sm: 3 } }}>
    {/* The figure is the picker: each center's symbol is a named, 44px button placed on the spine. */}
    <Box role="group" aria-label="Choose a chakra on the seated figure" className="aura-highlight"
      sx={{ position: "relative", width: { xs: 216, sm: "100%" }, height: { xs: 270, sm: "auto" }, maxHeight: 360, aspectRatio: "4 / 5", alignSelf: "center", mx: "auto", minHeight: 0 }}>
      <Box component="img" src={body?.path ?? "/theme-assets/pathways/astrology-energy/chakra-illustrations/chakra-body-map.svg"}
        alt={body?.alternativeText ?? "Seated human silhouette with seven centers aligned along the spine"}
        sx={{ width: "100%", height: "100%", display: "block", objectFit: "contain", borderRadius: "sm" }} />
      {chakras.map((chakra, index) => {
        const selected = chakra.key === current.key;
        const linked = linkedKeys.has(chakra.key);
        // Three invisible target lanes keep 44px controls separate while the visible symbols stay on the body's centerline.
        const targetOffset = [0, -52, 52][index % 3];
        const symbolTransform = targetOffset === 0 ? "translate(-50%, -50%)" : `translate(calc(-50% + ${-targetOffset}px), -50%)`;
        return <Box key={chakra.key} sx={{ position: "absolute", top: `${CHAKRA_BODY_MAP_TOP[chakra.key]}%`, left: "50%", transform: "translate(-50%, -50%)", width: 0, height: 0, zIndex: selected ? 2 : 1 }}>
          <Button size="sm" variant="plain" color="neutral" aria-pressed={selected}
            aria-label={`${chakra.displayName} · ${chakra.sanskritName}${linked ? " · connects with your current mood" : ""}`} onClick={() => setSelectedKey(chakra.key)}
            sx={{ position: "absolute", top: 0, left: targetOffset, transform: "translate(-50%, -50%)", p: 0, minHeight: 44, minWidth: 44, borderRadius: "50%", bgcolor: "transparent", "--variant-plainHoverBg": "transparent", "--variant-plainActiveBg": "transparent", "&:hover, &:active": { bgcolor: "transparent" }, "&:focus-visible": { outline: "none" } }}>
            <Box component="img" alt="" src={iconFor(chakra.key, chakra.symbolAssetKey)}
              sx={{ position: "absolute", top: "50%", left: "50%", transform: symbolTransform, width: { xs: 18, sm: 24 }, height: { xs: 18, sm: 24 }, objectFit: "contain", borderRadius: "50%",
                outline: selected ? "2px solid var(--al-theme-focus)" : "none", outlineOffset: 2 }} />
          </Button>
          {/* Names sit beside the figure on wider screens; the aura connection label shows on its chakra everywhere. */}
          <Typography level="body-xs" aria-hidden="true" sx={{ position: "absolute", top: 0, left: 26, transform: "translateY(-50%)", display: { xs: linked ? "block" : "none", sm: "block" }, whiteSpace: "nowrap", fontWeight: selected || linked ? 600 : 500,
            px: .5, py: .25, border: "1px solid var(--al-theme-control-border)", borderRadius: "sm", bgcolor: "var(--al-theme-surface)", color: "var(--al-theme-ink)", boxShadow: "0 0 10px var(--al-theme-glow)" }}>
            {linked ? <>{"★ "}<Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{chakra.displayName} · </Box>your aura<Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}> today</Box></> : chakra.displayName}
          </Typography>
        </Box>;
      })}
    </Box>

    <Box aria-live="polite" data-testid="chakra-detail-card" tabIndex={0} aria-label={`${current.displayName} details`} sx={{ minHeight: 0, overflow: { xs: "visible", sm: "auto" }, p: { xs: 1, sm: 1.5 }, border: "1px solid var(--al-theme-control-border)", borderRadius: "sm", bgcolor: "var(--al-theme-surface)", color: "var(--al-theme-ink)" }}>
      <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
        <Box component="img" src={iconFor(current.key, current.symbolAssetKey)} alt="" sx={{ width: 40, height: 40, objectFit: "contain" }} />
        <Typography component="h2" level="h3" className="pathway-display-title" aria-label={`${current.displayName} · ${current.sanskritName}`}>{current.displayName}</Typography>
      </Box>
      <Typography level="body-sm" sx={{ mt: .5, color: "var(--al-theme-ink-muted)" }}>{current.sanskritName} · {current.bodyLocation}</Typography>
      {currentLink && <Typography level="body-sm" sx={{ mt: 1, color: "var(--al-theme-primary)" }}>★ Your {currentLink.moodName.toLowerCase()} mood ({currentLink.auraName}) connects here.</Typography>}
      {!moodsLoading && !latest && <Typography level="body-sm" sx={{ mt: 1, color: "var(--al-theme-ink-muted)" }}>Log a mood to see where your aura connects. <RouterLink to="/dashboard">Check in</RouterLink></Typography>}
      {/* The center's meaning is the card's main content (formerly behind "Read more"). */}
      <Typography level="body-md" sx={{ mt: 1.5 }}>{current.description}</Typography>
      <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", columnGap: 2, rowGap: .75, fontSize: "var(--joy-fontSize-sm)", my: 1.5 }}>
        <Box component="dt" sx={{ color: "var(--al-theme-ink)" }}>Color association</Box><Box component="dd" sx={{ m: 0, display: "inline-flex", alignItems: "center", gap: .75 }}><Box data-testid="chakra-color-swatch" aria-hidden="true" sx={{ width: 18, height: 18, flex: "0 0 18px", border: "1px solid var(--al-theme-control-border)", borderRadius: "50%", bgcolor: colorAura?.baseHex ?? current.colorAssociation.toLowerCase() }} />{current.colorAssociation}</Box>
        {current.elementAssociation && <><Box component="dt" sx={{ color: "var(--al-theme-ink)" }}>Element association</Box><Box component="dd" sx={{ m: 0 }}>{current.elementAssociation}</Box></>}
        <Box component="dt" sx={{ color: "var(--al-theme-ink)" }}>Challenges in this lens</Box><Box component="dd" sx={{ m: 0 }}>{current.challengeAssociation}</Box>
      </Box>
      <Box sx={{ borderTop: "1px solid var(--al-theme-border)", pt: .5 }}>
        <Box component="details" className="pathway-disclosure">
          <Box component="summary">This week and patterns</Box>
          <Typography level="body-sm" sx={{ mt: 1 }} data-testid="chakra-week-strip">{currentWeekDays ? `Your moods connected here on ${currentWeekDays} ${currentWeekDays === 1 ? "day" : "days"} this week.` : "No check-ins connected here this week."}</Typography>
          {pattern && <Box sx={{ mt: 1 }} role="group" aria-label="Optional mood and chakra reflection">
            <Typography level="title-sm">A pattern to explore</Typography>
            <Typography level="body-sm" sx={{ mt: .5 }}>You logged {pattern.chakra.moodAssociationKeys.map((key) => data?.moods.find((mood) => mood.key.toLowerCase() === key.toLowerCase())?.displayName ?? key).join(" or ")} on {pattern.count} days in the past two weeks. Does the {pattern.chakra.interpretiveTheme.toLowerCase()} theme connect with your experience?</Typography>
            <InsightFeedback pathway="energy" moduleKey="chakra-reference" insightType="chakra-mood-pattern" />
          </Box>}
        </Box>
        {/* The reflection prompt renders only inside "Add a reflection". */}
        <PathwayReflectionPrompt key={current.key} pathway="energy" moduleKey="chakra-reference" insightType="chakra-theme" prompt={current.reflectionPrompt} />
      </Box>
      <Typography level="body-xs" sx={{ mt: 1.5, color: "var(--al-theme-ink-muted)" }}>Associations vary and are offered for reflection only; they are not a diagnosis or universal teaching.</Typography>
    </Box>
  </Box>;
}

/** Local calendar boundaries keep the two-week pattern sample and the 7-day strip aligned with journal days. */
function recentDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  const week = new Date(end);
  week.setDate(week.getDate() - 6);
  const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { startDate: localDate(start), endDate: localDate(end), weekStart: localDate(week) };
}
