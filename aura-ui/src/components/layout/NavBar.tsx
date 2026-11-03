import Box from "@mui/joy/Box";
import Link from "@mui/joy/Link";
import IconButton from "@mui/joy/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import Popover from "@mui/material/Popover";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store/store";
import { logout, selectCurrentUser } from "../../store/slices/authSlice";
import type { MouseEvent } from "react";
import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { openProfileModal } from "@/store/slices/uiSlice";
import { getProfileCompletion } from "@/util/profile";

const NavBar = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const dispatch = useDispatch();
  const appDispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [avatarAnchor, setAvatarAnchor] = useState<HTMLButtonElement | null>(null);

  const handleLogout = () => {
    setAvatarAnchor(null);
    dispatch(logout());
    navigate("/home");
  };

  /** Opens the compact account summary used in place of the old sidebar card. */
  const handleAvatarClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAvatarAnchor((current) => (current ? null : event.currentTarget));
  };

  const profileCompletion = user ? getProfileCompletion(user) : 0;
  const avatarValue = user?.avatar ?? "";
  const avatarIsImage = avatarValue.startsWith("/") || avatarValue.startsWith("http");

  const goTo = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(path);
  };

  return (
    <Sheet component="header" variant="plain" sx={{ borderBottom: "1px solid", borderColor: "divider", backgroundColor: "rgba(251,248,242,.82)", backdropFilter: "blur(14px)" }}>
      <Box sx={{ display: "flex", alignItems: "center", minHeight: { xs: 68, md: 82 }, px: { xs: 2, md: 4 }, gap: 2 }}>
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
        <Typography level="body-sm" sx={{ display: { xs: "none", sm: "block" }, mr: 1, color: "neutral.500", letterSpacing: "0.08em" }}>
          A brighter day begins with a small pause.
        </Typography>
        <Box component="nav" aria-label="Main navigation" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
          {isAuthenticated && (
            <>
              <IconButton aria-label="Open profile menu" onClick={handleAvatarClick} sx={{ ml: 1, p: 0.5 }}>
                <Avatar
                  alt={user?.displayName ?? "Your profile"}
                  src={avatarIsImage ? avatarValue : undefined}
                  sx={{ width: 36, height: 36, bgcolor: "primary.400", color: "common.white", fontSize: "0.9rem" }}
                >
                  {!avatarIsImage && (avatarValue || user?.displayName?.slice(0, 1) || "A")}
                </Avatar>
              </IconButton>
              <Popover
                open={Boolean(avatarAnchor)}
                anchorEl={avatarAnchor}
                onClose={() => setAvatarAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                sx={{ p: 2, width: 280, borderRadius: "lg", boxShadow: "lg" }}
              >
                <Stack gap={1.5}>
                  <Box>
                    <Typography level="title-md">{user?.displayName ?? "Your profile"}</Typography>
                    <Typography level="body-sm" color="neutral">{user?.email ?? ""}</Typography>
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                      <Typography level="body-xs" color="neutral">Profile progress</Typography>
                      <Typography level="body-xs" color="neutral">{`${profileCompletion}%`}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={profileCompletion} sx={{ height: 7, borderRadius: 4 }} />
                  </Box>
                  <Button
                    variant="outlined"
                    color="neutral"
                    onClick={() => { setAvatarAnchor(null); appDispatch(openProfileModal()); }}
                  >
                    Edit profile
                  </Button>
                </Stack>
              </Popover>
            </>
          )}
        </Box>
      </Box>
    </Sheet>
  );
};

export default NavBar;
