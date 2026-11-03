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

const Sidebar = () => {
  const location = useLocation();

  return (
    <Stack component="nav" aria-label="Journal navigation" spacing={0.5} sx={{ mt: { xs: 1, md: 2 }, position: { md: "sticky" }, top: { md: 24 } }}>
      <Typography level="body-xs" sx={{ px: 1.5, mb: 1, textTransform: "uppercase", letterSpacing: "0.16em", color: "neutral.500" }}>
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
            bgcolor: location.pathname === path ? "rgba(199,154,152,.24)" : "transparent",
            border: "1px solid",
            borderColor: location.pathname === path ? "rgba(199,154,152,.24)" : "transparent",
            borderRadius: "md",
            transition: "background-color 0.2s, border-color 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            textDecoration: "none",
            "&:hover": { bgcolor: "rgba(199,154,152,.16)", borderColor: "rgba(199,154,152,.2)" },
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
