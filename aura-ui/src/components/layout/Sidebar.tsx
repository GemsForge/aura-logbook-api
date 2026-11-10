import Stack from "@mui/joy/Stack";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { Link, useLocation } from "react-router-dom";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";

const navItems = [
  { label: "Today", path: "/dashboard", icon: HomeOutlined },
  { label: "Log mood", path: "/log-mood", icon: EditNoteOutlined },
  { label: "Reflections", path: "/history", icon: MenuBookOutlined },
  { label: "Gallery", path: "/gallery", icon: PhotoLibraryOutlined },
  { label: "Insights", path: "/dashboard#insights", icon: InsightsOutlined },
];

/** Keeps journal destinations in a translucent rail that reflows below mobile content. */
const Sidebar = () => {
  const location = useLocation();
  const isCurrentDestination = (label: string, path: string) => {
    if (label === "Insights") return location.pathname === "/dashboard" && location.hash === "#insights";
    if (label === "Today") return location.pathname === path && location.hash !== "#insights";
    return location.pathname === path;
  };

  return (
    <Stack component="nav" aria-label="Journal navigation" spacing={1} sx={{ p: 1, mt: { xs: 1, md: 2 }, position: { md: "sticky" }, top: { md: 112 }, borderRadius: "lg", backgroundColor: "color-mix(in srgb, var(--al-theme-surface) 54%, transparent)" }}>
      <Typography className="aura-eyebrow" level="body-xs" sx={{ px: 1.5, py: 1, color: "neutral.500" }}>
        Your logbook
      </Typography>
      {navItems.map(({ label, path, icon: Icon }) => {
        const isCurrent = isCurrentDestination(label, path);
        return (
          <Sheet
            component={Link}
            to={path}
            variant="plain"
            aria-current={isCurrent ? "page" : undefined}
            key={label}
            sx={{
              bgcolor: isCurrent ? "var(--aura-wash)" : "transparent",
              border: "1px solid",
              borderColor: isCurrent ? "var(--aura-line)" : "transparent",
              borderRadius: "md",
              transition: "background-color 0.2s, border-color 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              textDecoration: "none",
              "&:hover": { bgcolor: "var(--aura-wash)", borderColor: "var(--aura-line)" },
            }}
          >
            <Icon sx={{ ml: 1.25, color: isCurrent ? "primary.700" : "neutral.500", fontSize: 20 }} />
            <Typography level="title-md" sx={{ py: 1.25, fontWeight: isCurrent ? 700 : 500, color: "neutral.800" }}>
              {label}
            </Typography>
          </Sheet>
        );
      })}
    </Stack>
  );
};

export default Sidebar;
