import Stack from "@mui/joy/Stack";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Today", path: "/dashboard" },
  { label: "Log mood", path: "/log-mood" },
  { label: "Reflections", path: "/history" },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <Stack component="nav" aria-label="Journal navigation" spacing={1} sx={{ mt: { xs: 1, md: 2 }, position: { md: "sticky" }, top: { md: 24 } }}>
      {navItems.map(({ label, path }) => (
        <Sheet
          component={Link}
          to={path}
          variant="plain"
          aria-current={location.pathname === path ? "page" : undefined}
          key={label}
          sx={{
            bgcolor: location.pathname === path ? "primary.softBg" : "transparent",
            border: "1px solid",
            borderColor: location.pathname === path ? "primary.softBorder" : "transparent",
            borderRadius: "md",
            transition: "background-color 0.2s, border-color 0.2s",
            display: "block",
            textDecoration: "none",
            "&:hover": { bgcolor: "primary.softBg", borderColor: "primary.softBorder" },
          }}
        >
          <Typography level="title-md" sx={{ p: 1.5, fontWeight: location.pathname === path ? 700 : 500 }}>
            {label}
          </Typography>
        </Sheet>
      ))}
    </Stack>
  );
};

export default Sidebar;
