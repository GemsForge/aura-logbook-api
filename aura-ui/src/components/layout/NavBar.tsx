import Box from "@mui/joy/Box";
import Link from "@mui/joy/Link";
import IconButton from "@mui/joy/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store/store";
import { logout } from "../../store/slices/authSlice";
import type { MouseEvent } from "react";

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

  const goTo = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(path);
  };

  return (
    <Sheet component="header" variant="plain" sx={{ borderBottom: "1px solid", borderColor: "divider", backgroundColor: "rgba(251,248,242,.82)", backdropFilter: "blur(14px)" }}>
      <Box sx={{ display: "flex", alignItems: "center", minHeight: 76, px: { xs: 2, md: 4 }, gap: 2 }}>
        <IconButton aria-label="Open navigation" sx={{ display: { xs: "inline-flex", md: "none" } }}>
          <MenuIcon />
        </IconButton>
        <Typography level="title-lg" sx={{ flexGrow: 1, fontFamily: "Georgia, serif", fontWeight: 400 }}>
          <Link
            href={isAuthenticated ? "/dashboard" : "/home"}
            aria-label="Aura Logbook home"
            color="neutral"
            underline="none"
            className="prism-brand-mark"
            sx={{ font: "inherit", fontWeight: "inherit", color: "text.primary" }}
          >
            <span data-testid="prism-mark" aria-hidden="true" />
            <span>Aura Logbook</span>
          </Link>
        </Typography>
        <Box component="nav" aria-label="Main navigation" sx={{ display: "flex", gap: 1 }}>
          <Link href={isAuthenticated ? "/dashboard" : "/home"} onClick={goTo(isAuthenticated ? "/dashboard" : "/home")} underline="none" color="neutral">Home</Link>
          {isAuthenticated && (
            <>
              <Link href="/dashboard" onClick={goTo("/dashboard")} underline="none" color="neutral">Dashboard</Link>
              <Button variant="plain" color="neutral" onClick={handleLogout}>Log out</Button>
            </>
          )}
          {!isAuthenticated && (
            <>
              <Link href="/login" onClick={goTo("/login")} underline="none" color="neutral">Login</Link>
              <Link href="/register" onClick={goTo("/register")} underline="none" color="primary">Create account</Link>
            </>
          )}
        </Box>
      </Box>
    </Sheet>
  );
};

export default NavBar;
