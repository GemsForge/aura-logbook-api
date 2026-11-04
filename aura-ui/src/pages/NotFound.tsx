import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";

/** Gives an unknown route the same welcoming shell and a working recovery action. */
export default function NotFound() {
  return <Box className="aura-panel" sx={{ p: { xs: 4, md: 8 }, maxWidth: 800, mx: "auto", textAlign: "center" }}>
    <Typography className="aura-eyebrow" color="neutral">A little off the path / 404</Typography>
    <Typography level="h1" className="aura-page-heading" sx={{ my: 3 }}>Room to begin again.</Typography>
    <Typography level="body-lg" color="neutral" sx={{ mb: 3 }}>This page isn’t here. Your logbook still is.</Typography>
    <Button component="a" href="/" variant="solid">Find your way home ↗</Button>
  </Box>;
}
