import { Typography, Stack } from "@mui/material";
import Sheet from "@mui/joy/Sheet";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Log Mood", path: "/log-mood" },
  { label: "Mood History", path: "/history" },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <Stack spacing={2} sx={{mt:2}}>
      {navItems.map(({ label, path }) => (
        <Sheet
          component={Link}
          to={path}
          variant="outlined"
          key={label}
          sx={{
            bgcolor:
              location.pathname === path ? "primary.softBg" : "background.surface",
            border: location.pathname === path ? "2px solid" : "1px solid",
            borderColor:
              location.pathname === path ? "primary.solidBg" : "neutral.outlinedBorder",
            borderRadius: "md",
            boxShadow: "sm",
            transition: "0.2s",
            display: "block",
            textDecoration: "none",
          }}>
          <Typography variant="subtitle1" align="center" sx={{ p: 2 }}>
            {label}
          </Typography>
        </Sheet>
      ))}
    </Stack>
  );
};

export default Sidebar;
