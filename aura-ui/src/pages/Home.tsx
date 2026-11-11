import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../store/store";
import AuraFeatureCards from "../components/home/AuraFeatureCard";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";

/** Introduces the journal with one clear action and a non-persistent mood-color preview. */
export default function HomePage() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const navigate = useNavigate();
  const { data: referenceData } = useGetReferenceDataQuery();
  const moodColorPreviews = (referenceData?.auras ?? []).map((aura) => ({
    name: aura.displayName,
    color: aura.shades?.[300] ?? aura.baseHex,
  }));
  const [previewColor, setPreviewColor] = useState({ name: "", color: "transparent" });
  useEffect(() => {
    if (!moodColorPreviews.some(({ name }) => name === previewColor.name) && moodColorPreviews[0]) {
      setPreviewColor(moodColorPreviews[0]);
    }
  }, [moodColorPreviews, previewColor.name]);

  const handleStart = () => {
    navigate(isAuthenticated ? "/dashboard" : "/register");
  };

  return (
    <Box sx={{ maxWidth: 1080, mx: "auto", py: { xs: 2, md: 6 }, px: { xs: 0, sm: 1 }, minWidth: 0 }}>
      <Box
        component="section"
        aria-labelledby="home-title"
        style={{ "--home-preview-color": previewColor.color } as CSSProperties}
        sx={{
          p: "clamp(2rem, 4vw, 3.5rem)",
          borderRadius: { xs: 4, md: 7 },
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.4fr) minmax(230px, .8fr)" },
          alignItems: "center",
          columnGap: { xs: 0, md: 5 },
          background: "radial-gradient(ellipse at 85% 8%, color-mix(in srgb, var(--home-preview-color) 28%, transparent), transparent 48%), radial-gradient(ellipse at 8% 100%, color-mix(in srgb, var(--home-preview-color) 15%, transparent), transparent 52%), var(--al-theme-canvas)",
          transition: "background 320ms ease",
        }}
      >
        <Box sx={{ maxWidth: "40rem" }}>
          <Typography id="home-title" component="h1" level="h1" sx={{ fontSize: "clamp(2rem, 1.4rem + 2.2vw, 3.25rem)", fontWeight: 450, letterSpacing: "-.045em", lineHeight: 1.1, maxWidth: "20ch", textWrap: "balance" }}>
            A quieter way to notice what matters.
          </Typography>
          <Typography level="title-lg" color="neutral" sx={{ mt: 1.5, maxWidth: "40ch", fontSize: "clamp(1.0625rem, 1rem + .3vw, 1.25rem)", fontWeight: 400, lineHeight: 1.55 }}>
            Pair your mood with a color. Watch the patterns appear.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5, mt: 3 }}>
            <Button variant="contained" onClick={handleStart} sx={{ minHeight: 48, px: 3 }}>
              {isAuthenticated ? "Open your logbook" : "Start your logbook"}
            </Button>
            {!isAuthenticated && (
              <Button variant="plain" color="neutral" onClick={() => navigate("/login")} sx={{ minHeight: 48, px: 2 }}>
                Log in
              </Button>
            )}
          </Box>
        </Box>

        <Box component="fieldset" sx={{ border: 0, m: 0, mt: { xs: 3, md: 0 }, justifySelf: { md: "end" }, width: "100%", maxWidth: 300, borderRadius: "24px", p: 2.5, background: "color-mix(in srgb, var(--al-theme-surface) 66%, transparent)", boxShadow: "0 18px 52px color-mix(in srgb, var(--home-preview-color) 14%, transparent)" }}>
          <Typography component="legend" level="body-sm" sx={{ mb: 1.25, color: "text.secondary" }}>
            Try a mood color
          </Typography>
          <Box role="group" aria-label="Preview mood colors" sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
            {moodColorPreviews.map(({ name, color }) => {
              const selected = previewColor.name === name;
              return (
                <Box
                  key={name}
                  component="button"
                  type="button"
                  aria-label={`Preview ${name} mood color`}
                  aria-pressed={selected}
                  onClick={() => setPreviewColor({ name, color })}
                  sx={{
                    width: 34,
                    height: 34,
                    p: 0,
                    borderRadius: "50%",
                    border: "2px solid var(--al-theme-surface)",
                    backgroundColor: color,
                    boxShadow: selected ? "0 0 0 2px var(--al-theme-focus), 0 4px 14px var(--al-theme-glow)" : "0 2px 8px var(--al-theme-glow)",
                    cursor: "pointer",
                    "&:focus-visible": { outline: "3px solid var(--al-theme-focus)", outlineOffset: 4 },
                  }}
                />
              );
            })}
          </Box>
          <Typography level="body-xs" color="neutral" sx={{ mt: 1.25 }}>
            Preview only. Your saved aura color and interface theme stay separate.
          </Typography>
        </Box>
      </Box>

      <Box component="section" aria-label="What Aura Logbook offers" sx={{ mt: { xs: 3, md: 5 } }}>
        <AuraFeatureCards />
      </Box>
      <Typography component="p" level="body-sm" color="neutral" sx={{ mt: { xs: 3, md: 4 }, textAlign: "center" }}>
        Private by design. Your journal and mood history belong to you.
      </Typography>
    </Box>
  );
}
