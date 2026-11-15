import { useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/joy";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useGetAllMoodsQuery } from "@/store/moodApi";
import type { MoodEntry } from "@/features/mood/models/schema";
import { CHAKRA_BODY_MAP_TOP } from "../chakraReference";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";

/** Body-led reference: named symbol controls update the educational detail and the artwork's selected marker. */
export function ChakraReference() {
  const { data, isLoading, isError, refetch } = useGetReferenceDataQuery();
  const [selectedKey, setSelectedKey] = useState("");
  const chakras = useMemo(() => data?.chakras.filter((item) => Object.prototype.hasOwnProperty.call(CHAKRA_BODY_MAP_TOP, item.key)) ?? [], [data?.chakras]);
  const current = chakras.find((item) => item.key === selectedKey) ?? chakras[0];
  const period = recentDateRange();
  const { data: entries } = useGetAllMoodsQuery(period);
  const moods: MoodEntry[] = entries ?? [];
  const body = data?.graphics.find((item) => item.key === "chakra-body-map");
  const symbol = data?.graphics.find((item) => item.key === current?.symbolAssetKey);
  const colorFor = (key: string) => data?.auras.find((item) => item.chakraKey?.replace(/_/g, "-") === key)?.baseHex ?? "var(--al-theme-primary)";
  // Count distinct recorded days, never infer an energetic condition from a mood key.
  const pattern = chakras.map((chakra) => {
    const keys = new Set(chakra.moodAssociationKeys.map((key) => key.toLowerCase()));
    const days = new Set(moods.filter((entry) => entry.moods.some((key) => keys.has(key.toLowerCase()))).map((entry) => entry.date));
    return { chakra, count: days.size };
  }).filter((item) => item.count >= 3).sort((a, b) => b.count - a.count)[0];

  if (isLoading) return <Typography role="status">Loading chakra reference…</Typography>;
  if (isError) return <Box><Typography role="status">Chakra reference is unavailable right now.</Typography><Button size="sm" variant="plain" onClick={() => void refetch()}>Try again</Button></Box>;
  if (!current) return <Typography role="status">No chakra references are available yet.</Typography>;

  return <Box component="section" id="chakra-reference" aria-label="Chakra reference" sx={{ minWidth: 0 }}>
    <Box data-testid="chakra-reference-grid" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "minmax(180px, .8fr) minmax(0, 1.2fr)" }, gap: { xs: 2, md: 4 }, alignItems: "start" }}>
      <Box sx={{ minWidth: 0 }}>
        <Box role="group" aria-label="Seven chakra centers on a seated human figure" className="aura-highlight" sx={{ position: "relative", width: { xs: 216, sm: 256, md: 288 }, maxWidth: "100%", aspectRatio: "4 / 5", mx: "auto", borderRadius: "sm" }}>
          <Box component="img" src={body?.path ?? "/theme-assets/pathways/astrology-energy/chakra-illustrations/chakra-body-map.svg"}
            alt={body?.alternativeText ?? "Seated human silhouette with seven colored centers aligned along the spine"}
            sx={{ width: "100%", height: "100%", display: "block", objectFit: "contain", borderRadius: "sm" }} />
          {/* The small anatomical markers are visual only. Their equivalent named controls below
              have separate 44px targets, so adjacent spine centers cannot intercept one another. */}
          <Box aria-hidden="true" sx={{ position: "absolute", pointerEvents: "none", top: `${CHAKRA_BODY_MAP_TOP[current.key]}%`, left: "50%", transform: "translate(-50%, -50%)", width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--al-theme-focus)", boxShadow: `0 0 12px ${colorFor(current.key)}` }} />
        </Box>
        <Typography level="body-xs" sx={{ mt: 1.5, textAlign: "center", color: "var(--al-theme-ink-muted)" }}>Choose a center by name to explore.</Typography>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box role="group" aria-label="Choose a chakra" sx={{ display: "flex", flexWrap: "wrap", gap: .5, mb: 2 }}>
          {chakras.map((chakra) => <Button key={chakra.key} size="sm" color="neutral" variant={chakra.key === current.key ? "soft" : "plain"} aria-pressed={chakra.key === current.key}
            aria-label={`${chakra.displayName} · ${chakra.sanskritName}`} onClick={() => setSelectedKey(chakra.key)} sx={{ minHeight: 44, px: 1, gap: .75, borderRadius: "sm" }}>
            <Box component="img" src={data?.graphics.find((item) => item.key === chakra.symbolAssetKey)?.path ?? `/theme-assets/pathways/astrology-energy/chakra-symbols/chakra-${chakra.key}.svg`} alt="" sx={{ width: 24, height: 24, objectFit: "contain" }} />{chakra.displayName}
          </Button>)}
        </Box>
        <Box aria-live="polite" aria-atomic="true">
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            {symbol && <Box component="img" src={symbol.path} alt="" sx={{ width: 44, height: 44, objectFit: "contain" }} />}
            <Typography component="h2" level="h2" className="pathway-display-title" aria-label={`${current.displayName} · ${current.sanskritName}`}>{current.displayName}</Typography>
          </Box>
          <Typography level="body-sm" sx={{ mt: .75, color: "var(--al-theme-ink-muted)" }}>{current.sanskritName} · {current.bodyLocation}</Typography>
          <Typography component="h3" level="title-md" sx={{ mt: 2.5 }}>{current.interpretiveTheme}</Typography>
          <Typography className="pathway-reflection-quote" sx={{ mt: 1.5, pl: 2, borderLeft: "2px solid var(--al-theme-primary)" }}>{current.reflectionPrompt}</Typography>
        </Box>
        <InsightFeedback key={current.key} pathway="energy" moduleKey="chakra-reference" insightType="chakra-theme" />
        <PathwayReflectionPrompt pathway="energy" moduleKey="chakra-reference" insightType="chakra-theme" prompt={current.reflectionPrompt} />
        <Box component="details" sx={{ mt: 2 }} className="pathway-disclosure">
          <Box component="summary">Read the reference</Box>
          <Typography level="body-sm" sx={{ mt: 1 }}>{current.description}</Typography>
          <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 1, fontSize: "var(--joy-fontSize-sm)", my: 2 }}>
            <Box component="dt">Color association</Box><Box component="dd" sx={{ m: 0 }}>{current.colorAssociation}</Box>
            {current.elementAssociation && <><Box component="dt">Element association</Box><Box component="dd" sx={{ m: 0 }}>{current.elementAssociation}</Box></>}
            <Box component="dt">Challenges in this lens</Box><Box component="dd" sx={{ m: 0 }}>{current.challengeAssociation}</Box>
          </Box>
          <Typography level="body-xs" sx={{ color: "var(--al-theme-ink-muted)" }}>Common Sanskrit names and body locations meet a contemporary psychological lens. Associations vary; they are not a diagnosis or universal teaching.</Typography>
        </Box>
      </Box>
    </Box>
    {pattern && <Box component="aside" aria-label="Optional mood and chakra reflection" sx={{ mt: 4, pt: 2, borderTop: "1px solid var(--al-theme-border)" }}>
      <Typography component="h3" level="title-md">A pattern to explore</Typography>
      <Typography level="body-sm" sx={{ mt: 1 }}>You logged {pattern.chakra.moodAssociationKeys.map((key) => data?.moods.find((mood) => mood.key.toLowerCase() === key.toLowerCase())?.displayName ?? key).join(" or ")} on {pattern.count} days in the past two weeks. Does the {pattern.chakra.interpretiveTheme.toLowerCase()} theme connect with your experience?</Typography>
      <InsightFeedback pathway="energy" moduleKey="chakra-reference" insightType="chakra-mood-pattern" />
      <PathwayReflectionPrompt pathway="energy" moduleKey="chakra-reference" insightType="chakra-mood-pattern" prompt="What, if anything, does this pattern mean to you?" />
    </Box>}
  </Box>;
}

/** Local calendar boundaries keep the reference's two-week sample aligned with journal days. */
function recentDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { startDate: localDate(start), endDate: localDate(end) };
}
