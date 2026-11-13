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
export function SunSignReading({ zodiac, loading, horoscope, horoscopeLoading, unavailable, description }: {
  zodiac?: ZodiacInsightResponse;
  loading: boolean;
  horoscope: DailyHoroscope | null;
  horoscopeLoading: boolean;
  unavailable: boolean;
  description?: string;
}) {
  const key = zodiac?.sign.toLowerCase();
  return <Box component="section" aria-labelledby="sun-sign-title" sx={{ minWidth: 0 }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, minHeight: 120 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography level="body-xs" sx={{ letterSpacing: ".1em", textTransform: "uppercase" }}>Daily horoscope</Typography>
        <Typography id="sun-sign-title" component="h2" level="h2" sx={{ textTransform: "capitalize", mt: .5 }}>{zodiac?.sign ?? "Your sun sign"}</Typography>
        {zodiac && <Typography level="body-sm" color="neutral" sx={{ textTransform: "capitalize", mt: .5 }}>{zodiac.element} · Sun sign</Typography>}
      </Box>
      {key && illustratedSigns.has(key) && <Box component="img" src={`/theme-assets/pathways/astrology-energy/zodiac-illustrations/zodiac-${key}.svg`} alt={`${zodiac?.sign} zodiac illustration`} sx={{ width: { xs: 88, sm: 120 }, height: { xs: 88, sm: 120 }, objectFit: "contain", flexShrink: 0 }} />}
    </Box>
    {loading ? <Typography role="status" level="body-sm">Loading your sign…</Typography>
      : !zodiac ? <Typography role="status" level="body-sm">Your sign reflection is unavailable right now.</Typography>
        : <>
          {horoscopeLoading ? <Typography role="status" level="body-sm">Loading today’s reading…</Typography>
            : horoscope ? <>
              <Typography component="blockquote" sx={{ m: 0, mt: 2, fontFamily: "var(--joy-fontFamily-display)", fontSize: "var(--joy-fontSize-xl)", lineHeight: 1.6 }}>{horoscope.text}</Typography>
              <Typography level="body-xs" color="neutral" sx={{ mt: 1.5 }}>{horoscope.date} · {horoscope.provider}</Typography>
              <InsightFeedback pathway="energy" moduleKey="daily-astrology" insightType="horoscope">
                <PathwayReflectionPrompt pathway="energy" moduleKey="daily-astrology" insightType="horoscope" prompt="What, if anything, would you like to carry into today?" />
              </InsightFeedback>
            </> : unavailable ? <Typography role="status" level="body-sm">Today’s reading is unavailable right now.</Typography> : null}
          {(description || zodiac.description) && <Box component="details" sx={{ mt: 2, pt: 1.5, borderTop: "1px solid var(--al-theme-border)", "& summary": { cursor: "pointer", minHeight: 32, fontWeight: 600 }, "& summary:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 } }}>
            <Box component="summary">Explore {zodiac.sign}</Box>
            <Typography level="body-sm" sx={{ mt: 1 }}>{description || zodiac.description}</Typography>
            <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>Common astrology associations. Decide which, if any, fit you.</Typography>
          </Box>}
        </>}
  </Box>;
}
