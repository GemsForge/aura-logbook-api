import { AppBar, Toolbar, Typography } from "@mui/material";

const Header = () => (
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h6" component="div">
        Aura Logbook
      </Typography>
    </Toolbar>
  </AppBar>
);

export default Header;
