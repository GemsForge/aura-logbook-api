import Stack from "@mui/joy/Stack";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { Link, useLocation } from "react-router-dom";
import HomeRounded from "@mui/icons-material/HomeRounded";
import EditNoteRounded from "@mui/icons-material/EditNoteRounded";
import AutoStoriesRounded from "@mui/icons-material/AutoStoriesRounded";
import { prismGarden } from "@/theme";

const navItems = [
  { label: "Today", path: "/dashboard", icon: HomeRounded },
  { label: "Log mood", path: "/log-mood", icon: EditNoteRounded },
  { label: "Reflections", path: "/history", icon: AutoStoriesRounded },
];

/**
 * Authenticated journal navigation.
 *
 * The destinations flow horizontally and wrap on small screens, then become a
 * vertical rail at the desktop breakpoint. Active-route state is conveyed by
 * both styling and `aria-current`, never by color alone.
 */
const Sidebar = () => {
  const location = useLocation();

  return (
    <Stack
      component="nav"
      aria-label="Journal navigation"
      direction={{ xs: "row", md: "column" }}
      spacing={1}
      sx={{
        flexWrap: { xs: "wrap", md: "nowrap" },
        alignItems: "stretch",
        p: 1,
        bgcolor: "rgba(255, 252, 247, 0.7)",
        border: "1px solid",
        borderColor: prismGarden.color.line,
        borderRadius: prismGarden.radius.card,
        boxShadow: prismGarden.shadow.soft,
      }}>
      {navItems.map(({ label, path, icon: Icon }) => {
        const isCurrent = location.pathname === path;

        return (
          <Sheet
            component={Link}
            to={path}
            variant="plain"
            aria-current={isCurrent ? "page" : undefined}
            key={label}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              flex: { xs: "1 1 8.5rem", md: "0 0 auto" },
              minHeight: 48,
              px: 1.5,
              py: 1,
              bgcolor: isCurrent ? "rgba(200, 121, 97, 0.13)" : "transparent",
              border: "1px solid",
              borderColor: isCurrent ? prismGarden.color.rose : "transparent",
              borderRadius: prismGarden.radius.control,
              color: prismGarden.color.ink,
              transition: "background-color 160ms ease, border-color 160ms ease",
              textDecoration: "none",
              "&:hover": { bgcolor: prismGarden.color.surfaceSoft },
              "&:focus-visible": {
                outline: `3px solid ${prismGarden.color.focus}`,
                outlineOffset: 2,
              },
            }}>
            <Icon aria-hidden="true" fontSize="small" />
            <Typography
              level="title-sm"
              sx={{ fontWeight: isCurrent ? 700 : 500 }}>
              {label}
            </Typography>
          </Sheet>
        );
      })}
    </Stack>
  );
};

export default Sidebar;
