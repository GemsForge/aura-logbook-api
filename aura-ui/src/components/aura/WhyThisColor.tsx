import { useState } from "react";
import Box from "@mui/joy/Box";
import Link from "@mui/joy/Link";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Typography from "@mui/joy/Typography";
import { AuraModal } from "@/components/ui/AuraModal";
import { useGetCurrentAuraQuery } from "@/store/auraApi";
import { useGetCurrentUserQuery } from "@/store/authApi";
import { useGetAllMoodsQuery } from "@/store/moodApi";
import { useGetReferenceDataQuery, type ReferenceDataConfiguration } from "@/store/referenceDataApi";
import type { MoodEntry } from "@/features/mood/models/schema/MoodEntry";
import dayjs from "dayjs";

/**
 * Pairs the saved aura with concise authored associations, actual entry counts, and recorded mood names.
 * Associations come from reference data, never a guessed interpretation of a blended hue. Private history loads only on open.
 */
export function WhyThisColor() {
  const [open, setOpen] = useState(false);
  const { data: user } = useGetCurrentUserQuery();
  const enabled = !!user && user.auraRevealsEnabled !== false;
  const { data: aura } = useGetCurrentAuraQuery(undefined, { skip: !enabled });
  const { data: reference, isFetching: referenceLoading, isError: referenceError, refetch: reloadReference } = useGetReferenceDataQuery(undefined, { skip: !enabled || !open });
  const { data: entries = [], isFetching, isError: entriesError, refetch: reloadEntries } = useGetAllMoodsQuery({ startDate: dayjs().subtract(29, "day").format("YYYY-MM-DD"), endDate: dayjs().format("YYYY-MM-DD") }, { skip: !enabled || !open });
  if (!enabled) return null;
  const contributors = aura?.contributors ?? [];
  const color = aura?.hue == null ? undefined : `oklch(${aura.lightness} ${aura.chroma} ${aura.hue})`;
  const contexts = colorContext(reference, entries);
  return (
    <>
      <Link component="button" onClick={() => setOpen(true)} sx={{ minHeight: 44 }}>Why this color?</Link>
      <AuraModal open={open} onClose={() => setOpen(false)} title="Today’s color">
        {color && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box aria-label="Current reflected color" role="img" sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: color, border: "1px solid", borderColor: "divider" }} />
            <Typography level="body-sm" color="neutral">Your current aura</Typography>
          </Box>
        )}
        <Typography component="h3" level="title-sm">Colors in your logs · last 30 days</Typography>
        {isFetching || referenceLoading ? <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Loading your color context…</Typography>
          : referenceError || entriesError ? <Typography role="status" level="body-sm" sx={{ mt: 1 }}>Color connections aren’t available right now. <Link component="button" onClick={() => { void reloadReference(); void reloadEntries(); }}>Try again</Link></Typography>
          : contexts.length > 0 ? <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
            {contexts.map(({ aura: definition, moods, count }) => <Box key={definition.key} sx={{ pl: 1.5, borderLeft: `3px solid ${definition.baseHex}` }}>
              <Typography level="title-sm">{definition.displayName} <Typography component="span" level="body-xs" color="neutral">· {count} {count === 1 ? "check-in" : "check-ins"}</Typography></Typography>
              <Typography level="body-sm">{definition.description}</Typography>
              <Typography level="body-xs" color="neutral">Recorded: {moods.join(", ")}</Typography>
            </Box>)}
          </Box> : <Typography level="body-sm" sx={{ mt: 1 }}>{entries.length === 0 ? "No check-ins in this period yet." : "No color associations are available for these check-ins."}</Typography>}
        <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>Meanings from Aura’s guide. Keep what fits.</Typography>
        <Box component="details" sx={{ mt: 1.5 }}>
          <Typography component="summary" level="body-sm" sx={{ cursor: "pointer", py: .5 }}>How this color took shape</Typography>
          {contributors.length > 0 ? <List marker="disc">{contributors.map((c) => <ListItem key={c}>{c}</ListItem>)}</List>
            : <Typography level="body-sm" sx={{ mt: 1 }}>Your color takes shape as you check in and can shift with what you record.</Typography>}
          <Typography level="body-xs" color="neutral">Recent check-ins have the strongest influence. This is a reflection, not a label.</Typography>
        </Box>
      </AuraModal>
    </>
  );
}

/** Lists up to three color associations actually represented in recent entries, counting each color once per entry. */
function colorContext(reference: ReferenceDataConfiguration | undefined, entries: MoodEntry[]) {
  return (reference?.auras ?? []).map((aura) => {
    const names = new Set<string>();
    let count = 0;
    for (const entry of entries) {
      const matches = entry.moods.map((key) => reference?.moods.find((mood) => mood.key.toLowerCase() === key.toLowerCase()))
        .filter((mood) => mood?.auraColorKeys[0] === aura.key);
      if (matches.length > 0) count++;
      matches.forEach((mood) => { if (mood) names.add(mood.displayName); });
    }
    return { aura, count, moods: [...names] };
  }).filter(({ count }) => count > 0).sort((a, b) => b.count - a.count || (a.aura.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.aura.sortOrder ?? Number.MAX_SAFE_INTEGER)).slice(0, 3);
}
