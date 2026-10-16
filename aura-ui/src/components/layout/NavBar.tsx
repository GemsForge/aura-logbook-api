import Box from "@mui/joy/Box";
import Link from "@mui/joy/Link";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
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
    <Sheet component="header" variant="solid" color="primary">
      <Box sx={{ display: "flex", alignItems: "center", minHeight: 64, px: 2 }}>
        <Typography level="title-lg" sx={{ flexGrow: 1 }}>
          <Link
            component="button"
            type="button"
            color="neutral"
            underline="none"
            onClick={() => navigate("/home")}
            sx={{ font: "inherit", fontWeight: "inherit", color: "inherit" }}
          >
            Aura Logbook
          </Link>
        </Typography>
        <Box component="nav" aria-label="Main navigation" sx={{ display: "flex", gap: 1 }}>
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
      </Box>
    </Sheet>
  );
};

export default NavBar;
