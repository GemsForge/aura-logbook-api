import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { Link } from "react-router-dom";
import { ThemeBanner } from "@/components/ui/ThemeBanner";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";

/** Optional, user-led prayer/reflection page; it never assumes a specific religion or prayer form. */
export default function GuidedPrayer() {
  const user = useAppSelector(selectCurrentUser);
  const tradition = user?.pathwayPreferences?.faithTradition ?? "neutral";
  return <Box className="signed-in-content" sx={{ maxWidth: 840, mx: "auto" }}>
    <ThemeBanner title="A guided moment" description="Prayer is optional. Use your own words, adapt the prompts, or choose a neutral reflection." illustration="journal" />
    <Sheet component="article" className="aura-panel" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography component="h2" level="title-lg">Take this at your own pace</Typography>
      <Box component="ol" sx={{ pl: 2.5, display: "grid", gap: 1.5 }}>
        <li><Typography level="body-md">Pause for a moment. If it feels comfortable, notice one gentle breath.</Typography></li>
        <li><Typography level="body-md">Bring to mind something you would like to carry into this moment.</Typography></li>
        <li><Typography level="body-md">You may offer a prayer in your own tradition, name a value, or simply sit quietly.</Typography></li>
        <li><Typography level="body-md">When you are ready, return to your day. Nothing needs to be completed.</Typography></li>
      </Box>
      <Typography level="body-sm" color="neutral" sx={{ mt: 2 }}>Selected lens: {tradition === "neutral" ? "Neutral reflection" : tradition}. The wording above is intentionally non-denominational.</Typography>
      <Button component={Link} to="/pathways" variant="outlined" sx={{ mt: 2 }}>Back to Pathways</Button>
    </Sheet>
  </Box>;
}
