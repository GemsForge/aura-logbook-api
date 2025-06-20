import { Box, Button, Divider, Typography } from "@mui/material";
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
    isAuthenticated ? navigate("/dashboard") : navigate("/login");
  };

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Welcome to Aura Logbook
      </Typography>
      <Typography variant="h6" gutterBottom>
        Your energy tells a story—log it, explore it, and grow from it.
      </Typography>

      <Typography variant="body1" sx={{ mt: 2, maxWidth: 700 }}>
        Aura Logbook isn’t just about tracking mood—it’s about tuning in. Each
        entry helps you understand the emotional energy around you, visualized
        through color-coded auras and guided by chakra wisdom.
      </Typography>

      <Box component="section" sx={{ mt: 4 }}>
      <AuraFeatureCards/>
      </Box>

      <Box m={4}>
        <Button variant="contained" onClick={handleGetStarted}>
          Start Your Aura Journey
        </Button>
      </Box>

      <Divider />
      <Typography align="center" sx={{ mt: 2, fontStyle: "italic" }}>
        “When you track your aura, you tune into your truth.”
      </Typography>
    </Box>
  );
}