import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import type { DailyPathwayReflection } from "../useDailyPathwayReflection";

export type MoodReflectionResponse = "resonates" | "maybe" | "not-for-me";

/** Shows a shared invitation; the controlled response is persisted only when its mood entry is saved. */
export function MoodPathwayReflectionPanel({ reflection, response, onChange, disabled = false, loading = false, editing = false, error = false, onRetry }: {
  reflection?: DailyPathwayReflection; response?: MoodReflectionResponse | null;
  onChange?: (response: MoodReflectionResponse) => void; disabled?: boolean; loading?: boolean; editing?: boolean;
  error?: boolean; onRetry?: () => void;
}) {
  return <Sheet component="aside" aria-label="Optional pathway reflection" data-testid="pathway-reflection-panel" variant="soft" sx={{ p: { xs: 2, md: 3 }, borderRadius: "sm", minWidth: 0, height: "100%", bgcolor: "var(--al-theme-surface-raised)", border: 0 }}>
    <Typography level="body-xs" sx={{ letterSpacing: ".08em", mb: 2 }}>Optional reflection</Typography>
    {error ? <Typography role="alert" level="body-sm">This reflection couldn’t load. <Button type="button" size="sm" variant="plain" onClick={onRetry}>Try again</Button></Typography>
      : loading ? <Typography role="status" level="body-sm">Finding a reflection for this mood mix…</Typography>
      : reflection ? <Typography component="blockquote" sx={{ m: 0, py: 2, pl: 2, borderLeft: "2px solid var(--aura-accent)", bgcolor: "var(--aura-wash)", fontFamily: "var(--joy-fontFamily-display)", fontSize: "1.3rem", lineHeight: 1.55 }}>{reflection.text}</Typography>
        : <Typography level="body-sm" color="neutral">There isn’t a reflection for this combination yet.</Typography>}
    <Typography level="body-sm" color="neutral" sx={{ mt: 2 }}>A possible connection to consider. You decide what feels meaningful.</Typography>
    {onChange && reflection && !loading && !error && <>
      <Box role="group" aria-label="Possible connection" sx={{ display: "flex", flexWrap: "wrap", gap: .75, mt: 2 }}>
        {([['resonates', 'Resonates'], ['maybe', 'Maybe'], ['not-for-me', 'Not for me']] as const).map(([value, label]) => <Button key={value} type="button" variant={response === value ? "soft" : "outlined"} color="neutral" size="sm" aria-pressed={response === value} disabled={disabled} onClick={() => onChange(value)} sx={{ borderRadius: "sm", fontSize: ".75rem", minHeight: 36, px: .75, py: .25 }}>{label}</Button>)}
      </Box>
      <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>{editing ? "Your response stays with this mood entry." : "Your response saves with your mood."}</Typography>
    </>}
  </Sheet>;
}
