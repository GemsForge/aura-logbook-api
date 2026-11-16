import { Box, Typography } from "@mui/joy";
import type { ZodiacInsightResponse } from "@/features/zodiac/models/ZodiacInsightResponse";
import type { DailyHoroscope } from "../astrologyApi";
import { InsightFeedback } from "./InsightFeedback";
import { PathwayReflectionPrompt } from "./PathwayReflectionPrompt";

const illustratedSigns = new Set(["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"]);

/**
 * Gives the saved birthday's actual sign and provider reading a visual identity.
 * Sign characteristics come from the reference response; artwork never supplies personality claims.
 */
export function SunSignReading({ zodiac, loading, horoscope, horoscopeLoading, unavailable, description, onRetry }: {
  zodiac?: ZodiacInsightResponse;
  loading: boolean;
  horoscope: DailyHoroscope | null;
  horoscopeLoading: boolean;
  unavailable: boolean;
  description?: string;
  /** Retries the provider reading without reloading the rest of the pathway. */
  onRetry?: () => void;
}) {
  const key = zodiac?.sign.toLowerCase();
  return <Box component="section" aria-labelledby="sun-sign-title" sx={{ minWidth: 0 }}>
    {/* The saved sign's existing artwork anchors the reading; optional writing stays outside the hero. */}
    <Box className="aura-highlight" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr) 88px", sm: "minmax(0, 1.25fr) minmax(180px, .8fr)" }, columnGap: { xs: 1.5, sm: 3 }, alignItems: "center", p: { xs: 2, sm: 3.5 }, bgcolor: "var(--al-theme-surface-raised)", borderRadius: "sm", minWidth: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography level="body-sm" color="neutral">Your horoscope for today</Typography>
        <Typography id="sun-sign-title" className="pathway-display-title" component="h2" level="h2" sx={{ textTransform: "capitalize", fontFamily: "var(--joy-fontFamily-display)", fontSize: { xs: "2rem", sm: "3rem" }, fontWeight: 500, lineHeight: 1.15, mt: 1 }}>{zodiac?.sign ?? "Your sun sign"}</Typography>
        {zodiac && <Typography level="body-sm" color="neutral" sx={{ textTransform: "capitalize", mt: .75 }}>{zodiac.element} · Sun sign</Typography>}
      </Box>
      {key && illustratedSigns.has(key) && <Box component="img" src={`/theme-assets/pathways/astrology-energy/zodiac-illustrations/zodiac-${key}.svg`} alt={`${zodiac?.sign} zodiac illustration`} sx={{ width: "100%", maxWidth: 260, aspectRatio: "1", objectFit: "contain", justifySelf: "center", gridColumn: 2, gridRow: { xs: 1, sm: "1 / 4" } }} />}
      <Box sx={{ gridColumn: { xs: "1 / -1", sm: 1 }, minWidth: 0, mt: 2 }}>
        {loading ? <Typography role="status" level="body-sm">Loading your sign…</Typography>
          : !zodiac ? <Typography role="status" level="body-sm">Your sign reflection is unavailable right now.</Typography>
            : horoscopeLoading ? <Typography role="status" level="body-sm">Loading today’s reading…</Typography>
              : horoscope ? <>
                <Typography component="blockquote" sx={{ m: 0, fontFamily: "var(--joy-fontFamily-display)", fontSize: { xs: "var(--joy-fontSize-xl)", sm: "var(--joy-fontSize-xl2)" }, lineHeight: 1.6, maxWidth: "48ch", overflowWrap: "anywhere" }}>{horoscope.text}</Typography>
                <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>{horoscope.date} · {horoscope.provider}</Typography>
              </> : unavailable ? <Box><Typography role="status" level="body-sm">Today’s reading isn’t available right now.</Typography>{onRetry && <Box component="button" type="button" onClick={onRetry} sx={{ mt: .5, minHeight: 44, border: 0, px: 0, bgcolor: "transparent", color: "var(--al-theme-ink)", textDecoration: "underline", cursor: "pointer" }}>Try again</Box>}</Box> : null}
      </Box>
      {zodiac && (description || zodiac.description) && <Box component="details" sx={{ gridColumn: { xs: "1 / -1", sm: 1 }, mt: 1.5, "& summary": { cursor: "pointer", minHeight: 44, display: "list-item", alignContent: "center", fontSize: "var(--joy-fontSize-sm)" }, "& summary:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } }}>
        <Box component="summary">Explore {zodiac.sign}</Box>
        <Typography level="body-sm" sx={{ mt: .5 }}>{description || zodiac.description}</Typography>
        <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>Common astrology associations. Decide which, if any, fit you.</Typography>
      </Box>}
    </Box>
    {zodiac && horoscope && !horoscopeLoading && <Box sx={{ pt: .5 }}>
      <InsightFeedback pathway="energy" moduleKey="daily-astrology" insightType="horoscope" />
      <PathwayReflectionPrompt pathway="energy" moduleKey="daily-astrology" insightType="horoscope" prompt="What, if anything, would you like to carry into today?" />
    </Box>}
  </Box>;
}
