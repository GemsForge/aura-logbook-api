import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";

interface MoodStatCardProps {
  title: string;
  value: string;
  emoji?: string;
}

export default function MoodStatCard({
  title,
  value,
  emoji,
}: MoodStatCardProps) {
  return (
    <Sheet variant="plain" sx={{
      minWidth: 0, minHeight: { xs: 84, sm: 112 }, textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      p: { xs: 1.25, sm: 2 }, borderRadius: { xs: "md", sm: "lg" },
      bgcolor: "rgba(255,254,250,.64)", overflowWrap: "anywhere",
      border: "1px solid rgba(255,255,255,.82)",
      boxShadow: "0 5px 18px rgba(36,43,39,.045), inset 0 1px rgba(255,255,255,.72)",
      position: "relative", overflow: "hidden",
      "&::before": { content: '""', position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--aura-accent), var(--aura-glow))", opacity: .72 },
    }}>
        <Typography level="body-xs" textColor="text.secondary" sx={{ width: "100%", mb: 0.5, fontSize: "0.75rem", lineHeight: 1.25, letterSpacing: ".015em", textAlign: "center" }}>
          {title}
        </Typography>
        <Typography level="title-lg" sx={{ width: "100%", fontFamily: "display", fontWeight: 500, color: "neutral.900", lineHeight: 1.15, fontSize: { xs: "1rem", sm: "1.55rem" }, display: "flex", justifyContent: "center", alignItems: "center", gap: 0.4, textAlign: "center" }}>
          {emoji && <Box component="span" aria-hidden="true" sx={{ flexShrink: 0, fontFamily: "initial", fontSize: { xs: ".9rem", sm: "1.1rem" } }}>{emoji}</Box>}
          <Box component="span" sx={{ minWidth: 0 }}>{value}</Box>
        </Typography>
    </Sheet>
  );
}
