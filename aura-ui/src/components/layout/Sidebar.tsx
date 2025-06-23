import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Stack,
} from "@mui/material";
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
        <Card
          key={label}
          sx={{
            bgcolor:
              location.pathname === path ? "primary.light" : "background.paper",
            border: location.pathname === path ? "2px solid" : "1px solid",
            borderColor:
              location.pathname === path ? "primary.main" : "grey.300",
            borderRadius: 2,
            boxShadow: 1,
            transition: "0.2s",
          }}>
          <CardActionArea component={Link} to={path}>
            <CardContent>
              <Typography variant="subtitle1" align="center">
                {label}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
};

export default Sidebar;
