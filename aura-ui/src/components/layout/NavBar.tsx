import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store/store";
import { logout } from "../../store/slices/authSlice";

const NavBar = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/home");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Aura Logbook
        </Typography>
        <Box>
          <Button color="inherit" sx={{ color: "inherit" }} onClick={() => navigate("/home")}>
            Home
          </Button>
          {isAuthenticated && (
            <>
              <Button color="inherit" sx={{ color: "inherit" }} onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
              <Button color="inherit" sx={{ color: "inherit" }} onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
          {!isAuthenticated && (
            <>
              <Button color="inherit" sx={{ color: "inherit" }} onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button color="inherit" sx={{ color: "inherit" }} onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
