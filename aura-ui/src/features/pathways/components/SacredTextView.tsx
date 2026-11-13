import { Box, Button, Typography } from "@mui/joy";
import { useGetFaithWordOfDayQuery, useGetSacredPassageQuery } from "@/store/auraApi";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";
import { InsightFeedback } from "./InsightFeedback";

type SacredFramework = "christian" | "muslim" | "jewish";

interface SacredTextViewProps {
  /** Only a supported framework explicitly saved in the user's profile. */
  framework?: SacredFramework;
  /** Matching publisher destination; absent when no supported framework is selected. */
  publisher?: { name: string; url: string };
}

/** Shows a neutral daily reflection for everyone and sacred text only for the selected framework. */
export function SacredTextView({ framework, publisher }: SacredTextViewProps) {
  const word = useGetFaithWordOfDayQuery();
  const passage = useGetSacredPassageQuery(framework ?? "christian", { skip: !framework });

  return <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
    <Box component="section" aria-labelledby="word-of-day-title">
      <Typography id="word-of-day-title" component="h3" level="title-lg">Word of the Day</Typography>
      {word.isLoading ? <Typography role="status" level="body-sm" sx={{ mt: .5 }}>Loading today’s word…</Typography>
        : word.data ? <InsightFeedback pathway="faith" moduleKey="sacred-texts" insightType="word-of-day" hideContentWhenNotForMe>
          <>
            <Typography level="h3" sx={{ mt: .75 }}>{word.data.word}</Typography>
            <Typography level="body-sm" color="neutral" sx={{ mt: .35 }}>{word.data.reflection}</Typography>
            <PathwayReflectionPrompt pathway="faith" moduleKey="sacred-texts" insightType="word-of-day" prompt={word.data.reflection} />
          </>
        </InsightFeedback>
          : <Typography role="status" level="body-sm" sx={{ mt: .5 }}>Today’s word is unavailable right now.</Typography>}
    </Box>

    <Box component="section" aria-labelledby="sacred-text-title">
      <Typography id="sacred-text-title" component="h3" level="title-lg">Sacred text</Typography>
      {!framework || !publisher ? <Typography level="body-sm" color="neutral" sx={{ mt: .5 }}>
        Choose a supported framework in Profile settings to see its daily passage.
      </Typography>
        : passage.isLoading ? <Typography role="status" level="body-sm" sx={{ mt: .5 }}>Loading today’s passage…</Typography>
          : passage.data ? <>
            <Box component="blockquote" sx={{ m: 0, mt: .75 }}>
              <Typography level="title-md">“{passage.data.text}”</Typography>
            </Box>
            <Typography level="body-xs" color="neutral" sx={{ mt: .5 }}>
              {passage.data.reference} · {passage.data.translation}
            </Typography>
            <Typography level="body-xs" color="neutral" sx={{ mt: .25 }}>{passage.data.attribution}</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: .75 }}>
              <Button component="a" href={passage.data.readingUrl} target="_blank" rel="noreferrer" size="sm" variant="plain">
                Read passage at source
              </Button>
              <Button component="a" href={publisher.url} target="_blank" rel="noreferrer" size="sm" variant="plain">
                Open {publisher.name}
              </Button>
            </Box>
          </>
            : <Typography role="status" level="body-sm" sx={{ mt: .5 }}>
              A passage for your selected framework is unavailable right now.
            </Typography>}
    </Box>
  </Box>;
}
