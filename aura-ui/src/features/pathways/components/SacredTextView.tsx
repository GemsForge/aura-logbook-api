import { Box, Button, Skeleton, Typography } from "@mui/joy";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import { useGetSacredPassageQuery } from "@/store/auraApi";
import { FAITH_RESOURCES } from "../pathwayResources";
import { dailyFaithQuote } from "../dailyQuote";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";
import { InsightFeedback } from "./InsightFeedback";

type SacredFramework = "christian" | "muslim" | "jewish";

interface SacredTextViewProps {
  /** A profile-selected framework; unsupported values use the general daily quote. */
  framework?: string;
  /** Optional matching publisher supplied by the parent pathway page. */
  publisher?: { name: string; url: string };
}

const readingNames: Record<SacredFramework, string> = {
  christian: "Bible", muslim: "Quran", jewish: "Jewish texts",
};

/** Shows one daily reading, with provider requests and attribution limited to the selected framework. */
export function SacredTextView({ framework, publisher }: SacredTextViewProps) {
  const resource = FAITH_RESOURCES.find((item) => item.key === framework);
  const selectedFramework = resource?.key;
  const passage = useGetSacredPassageQuery(selectedFramework ?? "christian", { skip: !selectedFramework });
  const quote = dailyFaithQuote();
  // RTK Query's data can retain the previous argument's result during a switch; currentData cannot.
  const reading = selectedFramework && passage.currentData?.framework === selectedFramework
    && passage.currentData.text.trim() ? passage.currentData : undefined;
  const loading = Boolean(selectedFramework && (passage.isLoading || (passage.isFetching && !reading)));
  const hasReading = !selectedFramework || Boolean(reading);
  const heading = selectedFramework === "christian" ? "Verse of the day" : selectedFramework ? "Daily passage" : "Quote of the day";
  const selectedPublisher = publisher?.url === resource?.url ? publisher : resource;
  const prompt = reading
    ? `As you read ${reading.reference}, what stands out to you?`
    : `What, if anything, does this invitation bring to mind? “${quote.text}”`;

  return <Box className="aura-highlight" component="section" aria-labelledby="daily-reading-title"
    sx={{ p: { xs: 2, sm: 3 }, mt: 1, minWidth: 0, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm", color: "var(--al-theme-ink)", "& button, & a": { minHeight: 44 } }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.4fr) minmax(0, 1fr)" }, gap: { xs: 3, md: 4 }, alignItems: "start" }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" id="daily-reading-title" level="title-lg">{heading}</Typography>
        <Typography level="body-sm" sx={{ mt: .5, color: "var(--al-theme-ink-muted)" }}>
          {selectedFramework ? readingNames[selectedFramework] : `${quote.theme} · A moment for reflection`}
        </Typography>
        {loading ? <Box role="status" sx={{ mt: 3 }}>
          <Typography level="body-sm">Loading today’s passage…</Typography>
          <Skeleton variant="text" level="h3" sx={{ mt: 1 }} />
          <Skeleton variant="text" level="h3" />
          <Skeleton variant="text" level="body-sm" width="65%" />
        </Box> : hasReading ? <Box component="figure" sx={{ m: 0, mt: { xs: 2, sm: 3 } }}>
          <Box component="blockquote" sx={{ m: 0 }}>
            <Typography component="p" sx={{ fontFamily: "var(--aura-font-display, Georgia, 'Times New Roman', serif)", fontSize: { xs: "var(--joy-fontSize-xl2)", sm: "var(--joy-fontSize-xl3)" }, lineHeight: 1.65, color: "var(--al-theme-ink)", overflowWrap: "anywhere" }}>
              “{reading?.text ?? quote.text}”
            </Typography>
          </Box>
          <Box component="figcaption" sx={{ mt: 2 }}>
            <Typography level="title-sm">{reading?.reference ?? quote.author}</Typography>
            {reading && <>
              <Typography level="body-xs" sx={{ mt: .5, color: "var(--al-theme-ink-muted)" }}>{reading.translation}</Typography>
              <Typography level="body-xs" sx={{ mt: .5, color: "var(--al-theme-ink-muted)", overflowWrap: "anywhere" }}>{reading.attribution}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                <Button component="a" href={reading.readingUrl} target="_blank" rel="noreferrer" size="sm" variant="plain" endDecorator={<OpenInNewRounded />} sx={{ whiteSpace: "normal" }}>
                  Read passage at source
                </Button>
                {selectedPublisher && <Button component="a" href={selectedPublisher.url} target="_blank" rel="noreferrer" size="sm" variant="plain" sx={{ whiteSpace: "normal" }}>
                  Open {selectedPublisher.name}
                </Button>}
              </Box>
            </>}
          </Box>
        </Box> : <Box sx={{ mt: 3 }}>
          <Typography role="status" level="body-sm">A passage for your selected framework is unavailable right now.</Typography>
          <Button size="sm" variant="plain" onClick={() => void passage.refetch()} sx={{ mt: 1 }}>Try again</Button>
        </Box>}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Box component="img" src="/theme-assets/pathways/faith-religion/faith-religion-open-book.png"
          alt="An open book resting in a gentle pool of warm light."
          sx={{ display: "block", width: "100%", maxWidth: { xs: 180, sm: 280, md: 320 }, mx: "auto", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "sm" }} />
        {!loading && hasReading && <Box sx={{ mt: 2 }}>
          <Typography component="h3" level="title-md">Make room for a thought</Typography>
          <Typography level="body-xs" sx={{ mt: .5, color: "var(--al-theme-ink-muted)" }}>Optional. Your words stay private.</Typography>
          {/* The API's existing word-of-day type scopes journal responses and feedback to daily faith readings. */}
          <PathwayReflectionPrompt key={selectedFramework ?? quote.id} pathway="faith" moduleKey="sacred-texts" insightType="word-of-day" prompt={prompt} />
          <InsightFeedback key={selectedFramework ?? quote.id} pathway="faith" moduleKey="sacred-texts" insightType="word-of-day" />
        </Box>}
      </Box>
    </Box>
  </Box>;
}
