import Stack from "@mui/joy/Stack";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { Link, useLocation } from "react-router-dom";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";

const navItems = [
  { label: "Today", path: "/dashboard", icon: HomeOutlined },
  { label: "Log mood", path: "/log-mood", icon: EditNoteOutlined },
  { label: "Reflections", path: "/history", icon: MenuBookOutlined },
  { label: "Insights", path: "/dashboard", icon: InsightsOutlined },
];

/** Keeps journal destinations in a translucent rail that reflows below mobile content. */
const Sidebar = () => {
  const location = useLocation();

  return (
    <Stack component="nav" aria-label="Journal navigation" spacing={1} sx={{ p: 1, mt: { xs: 1, md: 2 }, position: { md: "sticky" }, top: { md: 112 }, borderRadius: "lg", backgroundColor: "rgba(255,254,250,.45)" }}>
      <Typography className="aura-eyebrow" level="body-xs" sx={{ px: 1.5, py: 1, color: "neutral.500" }}>
        Your logbook
      </Typography>
      {navItems.map(({ label, path, icon: Icon }) => (
        <Sheet
          component={Link}
          to={path}
          variant="plain"
          aria-current={location.pathname === path ? "page" : undefined}
          key={label}
          sx={{
            bgcolor: location.pathname === path ? "var(--aura-wash)" : "transparent",
            border: "1px solid",
            borderColor: location.pathname === path ? "var(--aura-line)" : "transparent",
            borderRadius: "md",
            transition: "background-color 0.2s, border-color 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            textDecoration: "none",
            "&:hover": { bgcolor: "var(--aura-wash)", borderColor: "var(--aura-line)" },
          }}
        >
          <Icon sx={{ ml: 1.25, color: location.pathname === path ? "primary.700" : "neutral.500", fontSize: 20 }} />
          <Typography level="title-md" sx={{ py: 1.25, fontWeight: location.pathname === path ? 700 : 500, color: "neutral.800" }}>
            {label}
          </Typography>
        </Sheet>
      ))}
    </Stack>
  );
};

export default Sidebar;
