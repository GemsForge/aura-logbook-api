import Box from "@mui/joy/Box";
import Link from "@mui/joy/Link";
import IconButton from "@mui/joy/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Divider from "@mui/joy/Divider";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import Popover from "@mui/material/Popover";
import EditOutlined from "@mui/icons-material/EditOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <Sheet component="header" variant="plain" sx={{ borderBottom: "1px solid", borderColor: "divider", backgroundColor: "rgba(251,248,242,.82)", backdropFilter: "blur(14px)" }}>
      <Box sx={{ display: "flex", alignItems: "center", minHeight: { xs: 68, md: 82 }, px: { xs: 2, md: 4 }, gap: 2 }}>
        <IconButton aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMobileMenuOpen((open) => !open)} sx={{ display: { xs: "inline-flex", md: "none" } }}>
          {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
        <Typography level="title-lg" sx={{ flexGrow: 1, fontFamily: "display", fontWeight: 400 }}>
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
        <Box component="nav" aria-label="Main navigation" sx={{ display: { xs: "none", md: "flex" }, gap: 1, alignItems: "center" }}>
          <Link href={isAuthenticated ? "/dashboard" : "/home"} onClick={goTo(isAuthenticated ? "/dashboard" : "/home")} underline="none" color="neutral">Home</Link>
          {isAuthenticated && (
            <>
              <Link href="/dashboard" onClick={goTo("/dashboard")} underline="none" color="neutral">Dashboard</Link>
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
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1.5,
                      p: 0,
                      width: { xs: "calc(100vw - 32px)", sm: 320 },
                      border: "1px solid",
                      borderColor: "#D9CEC0",
                      borderRadius: "20px",
                      overflow: "hidden",
                      boxShadow: "0 18px 48px rgba(78, 62, 51, 0.18)",
                    },
                  },
                }}
              >
                <Stack>
                  <Box sx={{ p: 2.5, background: "linear-gradient(135deg, #F4E7DF 0%, #F7F2EA 100%)" }}>
                    <Typography level="body-xs" sx={{ textTransform: "uppercase", letterSpacing: "0.18em", color: "neutral.600" }}>Your account</Typography>
                    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mt: 1.5 }}>
                      <Avatar
                        alt={user?.displayName ?? "Your profile"}
                        src={avatarIsImage ? avatarValue : undefined}
                        sx={{ width: 48, height: 48, bgcolor: "primary.400", color: "common.white", fontSize: "1.1rem" }}
                      >
                        {!avatarIsImage && (avatarValue || user?.displayName?.slice(0, 1) || "A")}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography level="title-md" noWrap>{user?.displayName ?? "Your profile"}</Typography>
                        <Typography level="body-sm" color="neutral" noWrap>{user?.email ?? ""}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                      <Typography level="body-sm" sx={{ fontWeight: 600 }}>Profile progress</Typography>
                      <Typography level="body-sm" color="neutral">{`${profileCompletion}%`}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={profileCompletion} sx={{ height: 8, borderRadius: 4, backgroundColor: "#EDE5D9", "& .MuiLinearProgress-bar": { backgroundColor: "#C87961", borderRadius: 4 } }} />
                    <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>Complete your profile to make this space feel more like yours.</Typography>
                    <Stack gap={0.5} sx={{ mt: 2 }}>
                      <Button variant="soft" color="neutral" startIcon={<EditOutlined />} onClick={() => { setAvatarAnchor(null); appDispatch(openProfileModal()); }} sx={{ justifyContent: "flex-start" }}>
                        Edit profile
                      </Button>
                      <Divider sx={{ my: 0.5 }} />
                      <Button variant="plain" color="neutral" startIcon={<LogoutOutlined />} onClick={handleLogout} sx={{ justifyContent: "flex-start" }}>
                        Log out
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Popover>
            </>
          )}
        </Box>
      </Box>
      {mobileMenuOpen && (
        <Box
          component="nav"
          aria-label="Mobile navigation"
          sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 0.5, px: 2, pb: 2, pt: 1, borderTop: "1px solid", borderColor: "rgba(217,206,192,.72)" }}
        >
          <Link href={isAuthenticated ? "/dashboard" : "/home"} onClick={goTo(isAuthenticated ? "/dashboard" : "/home")} underline="none" color="neutral" sx={{ p: 1.25, borderRadius: "md", "&:hover": { backgroundColor: "rgba(199,154,152,.16)" } }}>
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" onClick={goTo("/dashboard")} underline="none" color="neutral" sx={{ p: 1.25, borderRadius: "md", "&:hover": { backgroundColor: "rgba(199,154,152,.16)" } }}>Dashboard</Link>
              <Link href="/log-mood" onClick={goTo("/log-mood")} underline="none" color="neutral" sx={{ p: 1.25, borderRadius: "md", "&:hover": { backgroundColor: "rgba(199,154,152,.16)" } }}>Log mood</Link>
              <Link href="/history" onClick={goTo("/history")} underline="none" color="neutral" sx={{ p: 1.25, borderRadius: "md", "&:hover": { backgroundColor: "rgba(199,154,152,.16)" } }}>Reflections</Link>
            </>
          ) : (
            <>
              <Link href="/login" onClick={goTo("/login")} underline="none" color="neutral" sx={{ p: 1.25, borderRadius: "md", "&:hover": { backgroundColor: "rgba(199,154,152,.16)" } }}>Login</Link>
              <Link href="/register" onClick={goTo("/register")} underline="none" color="primary" sx={{ p: 1.25, borderRadius: "md", "&:hover": { backgroundColor: "rgba(199,154,152,.16)" } }}>Create account</Link>
            </>
          )}
        </Box>
      )}
    </Sheet>
  );
};

export default NavBar;
