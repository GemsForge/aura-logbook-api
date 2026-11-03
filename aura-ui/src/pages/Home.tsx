import Box from "@mui/joy/Box";
import Divider from "@mui/joy/Divider";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
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
    <Box sx={{ maxWidth: 1080, mx: "auto", py: { xs: 2, md: 6 }, minWidth: 0 }}>
      <Typography
        level="h1"
        sx={{ fontSize: { xs: "2.8rem", sm: "4.5rem" }, maxWidth: 760, letterSpacing: "-0.06em", lineHeight: 1.02 }}>
        A quieter way to notice what matters.
      </Typography>
      <Typography level="title-lg" sx={{ mt: 2, maxWidth: 620, color: "neutral.700", fontWeight: 400 }}>
        Aura Logbook gives your inner weather a place to land.
      </Typography>

      <Typography level="body-lg" sx={{ mt: 2, maxWidth: 650, color: "neutral.600" }}>
        Aura Logbook isn’t just about tracking mood—it’s about tuning in. Each
        entry helps you understand the emotional energy around you, visualized
        through color-coded auras and guided by chakra wisdom.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} sx={{ mt: 4 }}>
        <Button variant="contained" onClick={handleGetStarted} sx={{ minHeight: 48, px: 3 }}>
          Start your journey
        </Button>
        <Button variant="outlined" color="neutral" onClick={() => navigate("/register")} sx={{ minHeight: 48, px: 3 }}>
          Create an account
        </Button>
      </Stack>

      <Sheet variant="soft" sx={{ mt: 7, p: { xs: 2, md: 3 }, borderRadius: "lg", backgroundColor: "rgba(255,252,247,.72)" }}>
        <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.18em", color: "neutral.600" }}>A gentle practice</Typography>
        <Box component="section" sx={{ mt: 2 }}>
        <AuraFeatureCards />
        </Box>
      </Sheet>

      <Divider sx={{ mt: 5 }} />
      <Typography sx={{ mt: 2, color: "neutral.600", fontFamily: "display", fontStyle: "italic" }}>
        “When you track your aura, you tune into your truth.”
      </Typography>
    </Box>
  );
}
