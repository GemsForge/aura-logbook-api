import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { RootState } from "../../store/store";
import { logout } from "../../store/slices/authSlice";
import PrismMark from "./PrismMark";
import { prismGarden } from "@/theme";

const linkStyle = { color: "inherit", textDecoration: "none" } as const;
const navLinkSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  px: { xs: 1.25, sm: 1.5 },
  borderRadius: prismGarden.radius.control,
  bgcolor: "transparent",
  color: prismGarden.color.ink,
  fontSize: "0.9rem",
  fontWeight: 600,
  textDecoration: "none",
  "&:hover": { bgcolor: prismGarden.color.surfaceSoft },
  "&[aria-current='page']": {
    textDecoration: "underline",
    textUnderlineOffset: "0.35rem",
    textDecorationThickness: "2px",
  },
  "&:focus-visible": {
    outline: `3px solid ${prismGarden.color.focus}`,
    outlineOffset: 2,
  },
} as const;

/**
 * Global header and primary navigation for public and authenticated routes.
 *
 * Public links wrap into a second row on narrow screens instead of creating
 * horizontal overflow. `aria-current` exposes the active route, and all links
 * and actions retain a minimum 44px target with a visible keyboard focus ring.
 */
const NavBar = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/home");
  };

  return (
    <Sheet
      component="header"
      variant="plain"
      sx={{
        position: "relative",
        zIndex: 10,
        bgcolor: "rgba(255, 252, 247, 0.92)",
        borderBottom: "1px solid",
        borderColor: prismGarden.color.line,
        backdropFilter: "blur(14px)",
      }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          minHeight: { xs: 68, sm: 76 },
          width: "min(100%, 1440px)",
          mx: "auto",
          px: { xs: 2, sm: 3, lg: 5 },
          py: 1,
          rowGap: 0.5,
          gap: 1.5,
          minWidth: 0,
        }}>
        <Link
          to={isAuthenticated ? "/dashboard" : "/home"}
          aria-label="Aura Logbook home"
          style={{ ...linkStyle, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <PrismMark size={25} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                level="title-lg"
                sx={{
                  fontFamily: prismGarden.font.display,
                  fontSize: { xs: "1.18rem", sm: "1.42rem" },
                  fontWeight: 500,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                }}>
                Aura Logbook
              </Typography>
              <Typography
                level="body-xs"
                sx={{
                  display: { xs: "none", sm: "block" },
                  mt: 0.35,
                  color: prismGarden.color.inkMuted,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}>
                A moment for yourself
              </Typography>
            </Box>
          </Box>
        </Link>

        <Box
          component="nav"
          aria-label="Main navigation"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 0.25, sm: 0.75 },
            ml: "auto",
            width: { xs: isAuthenticated ? "auto" : "100%", sm: "auto" },
            minWidth: 0,
          }}>
          {!isAuthenticated && (
            <>
              <Sheet
                component={Link}
                to="/home"
                aria-current={
                  location.pathname === "/home" || location.pathname === "/"
                    ? "page"
                    : undefined
                }
                sx={navLinkSx}>
                Home
              </Sheet>
              <Sheet
                component={Link}
                to="/login"
                aria-current={location.pathname === "/login" ? "page" : undefined}
                sx={navLinkSx}>
                Login
              </Sheet>
              <Sheet
                component={Link}
                to="/register"
                aria-current={location.pathname === "/register" ? "page" : undefined}
                sx={{
                  ...navLinkSx,
                  bgcolor: prismGarden.color.surfaceSoft,
                  "&:hover": { bgcolor: prismGarden.color.stone },
                }}>
                Create account
              </Sheet>
            </>
          )}
          {isAuthenticated && (
            <Button color="neutral" variant="plain" onClick={handleLogout}>
              Log out
            </Button>
          )}
        </Box>
      </Box>
    </Sheet>
  );
};

export default NavBar;
