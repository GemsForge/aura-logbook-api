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
      <Sheet sx={{ p: { xs: 2.5, md: 6 }, borderRadius: "shell", background: "linear-gradient(135deg, #F4E7DF 0%, #FFFCF7 56%, #EDE5D9 100%)", border: "1px solid #D9CEC0", boxShadow: "0 18px 48px rgba(78, 62, 51, 0.1)" }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={{ xs: 4, md: 7 }} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.2em", color: "neutral.600" }}>Aura Logbook</Typography>
            <Typography level="h1" sx={{ mt: 1.5, fontSize: { xs: "2.8rem", sm: "4.6rem" }, maxWidth: 700, letterSpacing: "-0.065em", lineHeight: 0.98 }}>
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
          <Sheet variant="outlined" sx={{ width: { xs: "100%", md: 300 }, p: 2.5, borderRadius: "lg", backgroundColor: "rgba(255,252,247,.72)", borderColor: "rgba(217,206,192,.9)" }}>
            <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.16em", color: "neutral.600" }}>A moment for yourself</Typography>
            <Typography level="h3" sx={{ mt: 3, fontFamily: "display", fontWeight: 400 }}>How are you feeling?</Typography>
            <Stack direction="row" gap={1} sx={{ mt: 2 }}>
              {["#B8C2B0", "#E9C99D", "#E5AD85", "#D29D91", "#AEB0C2"].map((color) => <Box key={color} sx={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: color }} />)}
            </Stack>
            <Divider sx={{ my: 2.5 }} />
            <Typography level="body-md" color="neutral">A small pause can change the shape of a day.</Typography>
            <Typography level="body-sm" sx={{ mt: 2, color: "neutral.600", fontFamily: "display", fontStyle: "italic" }}>“Notice, don’t judge.”</Typography>
          </Sheet>
        </Stack>
      </Sheet>
      <Box component="section" sx={{ mt: { xs: 5, md: 8 } }}>
        <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.18em", color: "neutral.600" }}>A gentle practice</Typography>
        <Typography level="h2" sx={{ mt: 1, fontSize: { xs: "2rem", md: "2.6rem" }, letterSpacing: "-0.04em" }}>A little more awareness, every day.</Typography>
        <Box sx={{ mt: 2.5 }}><AuraFeatureCards /></Box>
      </Box>
      <Divider sx={{ mt: 6 }} />
      <Typography sx={{ mt: 2, color: "neutral.600", fontFamily: "display", fontStyle: "italic" }}>“When you track your aura, you tune into your truth.”</Typography>
    </Box>
  );
}
