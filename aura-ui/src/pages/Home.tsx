import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Divider from "@mui/joy/Divider";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../store/store";
import AuraFeatureCards from "../components/home/AuraFeatureCard";

export default function HomePage() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(isAuthenticated ? "/dashboard" : "/login");
  };

  return (
    <Box sx={{ maxWidth: 1160, mx: "auto", py: { xs: 2, md: 5 }, minWidth: 0 }}>
      <Sheet className="aura-panel" sx={{ p: { xs: 3, md: 7 }, position: "relative", overflow: "hidden" }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 4, md: 7 }} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <Typography className="aura-eyebrow" level="body-xs" color="neutral">Aura Logbook / A practice in being you</Typography>
            <Typography level="h1" sx={{ mt: 3, fontSize: { xs: "3.4rem", sm: "5.7rem" }, fontWeight: 400, maxWidth: 700, letterSpacing: "-0.07em", lineHeight: 0.96 }}>
              A quieter way to notice what matters.
            </Typography>
            <Typography level="title-lg" sx={{ mt: 2, maxWidth: 560, color: "neutral.700", fontWeight: 400 }}>
              Your energy tells a story. Give it a place to land.
            </Typography>
            <Typography level="body-lg" sx={{ mt: 1.5, maxWidth: 590, color: "neutral.600" }}>
              Aura Logbook isn’t just about tracking mood—it’s about tuning in. Notice your inner weather, one small pause at a time.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} sx={{ mt: 3.5 }}>
              <Button variant="contained" onClick={handleGetStarted} sx={{ minHeight: 48, px: 3 }}>Start your aura journey</Button>
              <Button variant="outlined" color="neutral" onClick={() => navigate("/register")} sx={{ minHeight: 48, px: 3 }}>Create an account</Button>
            </Stack>
          </Box>
          <Box sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0, p: 4, textAlign: "center" }}>
            <Box className="aura-orb" aria-hidden="true" sx={{ mx: "auto", my: 5, width: { xs: 180, sm: 240 } }} />
            <Typography className="aura-eyebrow" color="neutral" sx={{ mt: 6 }}>Feel. Reflect. Become.</Typography>
            <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>A moment for yourself.</Typography>
          </Box>
        </Stack>
      </Sheet>
      <Box component="section" sx={{ mt: { xs: 5, md: 8 } }}>
        <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.18em", color: "neutral.600" }}>A gentle practice</Typography>
        <Typography level="h2" sx={{ mt: 1, fontSize: { xs: "2rem", md: "2.6rem" }, letterSpacing: "-0.04em" }}>A little more awareness, every day.</Typography>
        <Box sx={{ mt: 2.5 }}><AuraFeatureCards /></Box>
      </Box>
      <Divider sx={{ mt: 6 }} />
      <Sheet className="aura-dark-panel" sx={{ mt: 4, p: { xs: 4, md: 7 }, textAlign: "center" }}><Typography sx={{ color: "inherit", fontFamily: "display", fontSize: { xs: "2rem", md: "3.3rem" }, lineHeight: 1.15 }}>“When you track your aura, you tune into your truth.”</Typography></Sheet>
    </Box>
  );
}
