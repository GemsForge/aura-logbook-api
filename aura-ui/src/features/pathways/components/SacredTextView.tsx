import { Box, Button, Skeleton, Typography } from "@mui/joy";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
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

  // Both existing illustrations are non-denominational: the book accompanies supported
  // readings; the olive branch keeps the unselected-framework quote visually neutral.
  const artwork = selectedFramework ? "faith-religion-open-book.png" : "faith-religion-olive-branch.png";

  return <Box component="section" aria-labelledby="daily-reading-title"
    sx={{ minWidth: 0, color: "var(--al-theme-ink)", "& button, & a": { minHeight: 44 } }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" id="daily-reading-title" level="title-lg">{heading}</Typography>
        <Typography level="body-sm" sx={{ mt: .5, color: "var(--al-theme-ink-muted)" }}>
          {selectedFramework ? readingNames[selectedFramework] : quote.theme}
        </Typography>
      </Box>
      <Box component="img" src={`/theme-assets/pathways/faith-religion/${artwork}`} alt=""
        sx={{ width: { xs: 88, sm: 132 }, height: { xs: 66, sm: 99 }, objectFit: "contain", flexShrink: 0 }} />
    </Box>
    {loading ? <Box role="status" sx={{ py: 3 }}>
      <Typography level="body-sm">Loading today’s passage…</Typography>
      <Skeleton variant="text" level="h3" sx={{ mt: 1 }} />
      <Skeleton variant="text" level="h3" />
      <Skeleton variant="text" level="body-sm" width="65%" />
    </Box> : hasReading ? <>
      <Box className="aura-highlight" component="figure" sx={{ m: 0, px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 4 }, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm" }}>
        <Box sx={{ maxWidth: 680, mx: "auto" }}>
          <Typography component="p" level="title-md" sx={{ mb: 2 }}>{reading?.reference ?? quote.author}</Typography>
          <Box component="blockquote" sx={{ m: 0 }}>
            <Typography component="p" sx={{ fontFamily: "var(--aura-font-display, Georgia, 'Times New Roman', serif)", fontSize: { xs: "var(--joy-fontSize-xl2)", sm: "var(--joy-fontSize-xl3)" }, lineHeight: 1.8, color: "var(--al-theme-ink)", overflowWrap: "anywhere" }}>
              “{reading?.text ?? quote.text}”
            </Typography>
          </Box>
          {reading && <Box component="figcaption" sx={{ mt: 3 }}>
            <Typography level="body-xs" sx={{ color: "var(--al-theme-ink-muted)" }}>{reading.translation}</Typography>
            <Typography level="body-xs" sx={{ mt: .5, color: "var(--al-theme-ink-muted)", overflowWrap: "anywhere" }}>{reading.attribution}</Typography>
          </Box>}
        </Box>
      </Box>
      {reading && <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, py: 1.5, borderBottom: "1px solid var(--al-theme-border)" }}>
        {/* Keep the primary action in Aura; publisher links remain available for attribution and further study. */}
        <Button component="a" href={`/pathways/sacred-texts/reader?reference=${encodeURIComponent(reading.reference)}`} size="sm" variant="solid" startDecorator={<MenuBookRounded />} sx={{ whiteSpace: "normal" }}>
          Read in Aura
        </Button>
        <Button component="a" href={reading.readingUrl} target="_blank" rel="noreferrer" size="sm" variant="plain" endDecorator={<OpenInNewRounded />} sx={{ whiteSpace: "normal" }}>
          Read passage at source
        </Button>
        {selectedPublisher && <Button component="a" href={selectedPublisher.url} target="_blank" rel="noreferrer" size="sm" variant="plain" sx={{ whiteSpace: "normal" }}>
          Open {selectedPublisher.name}
        </Button>}
      </Box>}
      <Box sx={{ mt: 2, maxWidth: 680 }}>
        {/* Keep the existing activity identity so prior reading feedback and journal entries remain compatible. */}
        <InsightFeedback key={selectedFramework ?? quote.id} pathway="faith" moduleKey="sacred-texts" insightType="word-of-day" />
        <PathwayReflectionPrompt key={selectedFramework ?? quote.id} pathway="faith" moduleKey="sacred-texts" insightType="word-of-day" prompt={prompt} />
      </Box>
    </> : <Box sx={{ py: 3 }}>
      <Typography role="status" level="body-sm">A passage for your selected framework is unavailable right now.</Typography>
      <Button size="sm" variant="plain" onClick={() => void passage.refetch()} sx={{ mt: 1 }}>Try again</Button>
    </Box>}
  </Box>;
}
