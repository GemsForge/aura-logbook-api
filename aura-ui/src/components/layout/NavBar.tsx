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
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          minHeight: 64,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 0 },
          gap: { xs: 0.5, sm: 1 },
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        <Typography level="title-lg" sx={{ flexGrow: 1, minWidth: 0 }}>
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
        <Box
          component="nav"
          aria-label="Main navigation"
          sx={{
            display: "flex",
            justifyContent: { xs: "space-between", sm: "flex-end" },
            flexWrap: "wrap",
            gap: { xs: 0.5, sm: 1 },
            minWidth: 0,
          }}
        >
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
