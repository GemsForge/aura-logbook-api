import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openProfileModal, selectIsProfileModalOpen } from "@/store/slices/uiSlice";

const destinations = [
  { label: "Today", path: "/dashboard", icon: HomeOutlined },
  { label: "Insights", path: "/dashboard#insights", icon: InsightsOutlined },
  { label: "Log mood", path: "/log-mood", icon: EditNoteOutlined },
  { label: "Reflections", path: "/history", icon: MenuBookOutlined },
  { label: "Gallery", path: "/gallery", icon: PhotoLibraryOutlined },
];

/** Keeps journal destinations and profile access within thumb reach above the device safe area. */
export default function MobileNavigation() {
  const { pathname, hash } = useLocation();
  const dispatch = useAppDispatch();
  const profileOpen = useAppSelector(selectIsProfileModalOpen);
  const itemStyles = {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 0.5, minHeight: 56, minWidth: 0, px: 0.5, borderRadius: "lg", color: "neutral.700",
    textDecoration: "none", border: 0, background: "transparent", cursor: "pointer",
    "&:hover": { backgroundColor: "var(--aura-wash)" },
    "&:focus-visible": { outline: "2px solid var(--aura-accent)", outlineOffset: 2 },
  };

  return (
    <Sheet component="nav" aria-label="Mobile journal navigation" sx={{
      display: { xs: "grid", md: "none" }, gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
      position: "fixed", left: 12, right: 12, bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
      zIndex: 1050, p: 0.5, borderRadius: "xl", border: "1px solid var(--aura-line)",
      backgroundColor: "color-mix(in srgb, var(--al-theme-surface) 92%, transparent)", backdropFilter: "blur(24px)",
      boxShadow: "0 8px 32px var(--al-theme-glow)",
    }}>
      {destinations.map(({ label, path, icon: Icon }) => {
        const isInsights = label === "Insights";
        const active = isInsights
          ? pathname === "/dashboard" && hash === "#insights" && !profileOpen
          : pathname === path && hash !== "#insights" && !profileOpen;
        return <Box key={path} component={Link} to={path} aria-current={active ? "page" : undefined}
          sx={{ ...itemStyles, backgroundColor: active ? "var(--aura-wash)" : "transparent" }}>
          <Icon aria-hidden="true" sx={{ fontSize: 23 }} />
          <Typography level="body-xs" sx={{ color: "inherit", fontWeight: active ? 700 : 500 }}>{label}</Typography>
        </Box>;
      })}
      <Box component="button" type="button" aria-haspopup="dialog" aria-expanded={profileOpen}
        onClick={() => dispatch(openProfileModal())}
        sx={{ ...itemStyles, backgroundColor: profileOpen ? "var(--aura-wash)" : "transparent" }}>
        <PersonOutline aria-hidden="true" sx={{ fontSize: 23 }} />
        <Typography level="body-xs" sx={{ color: "inherit", fontWeight: profileOpen ? 700 : 500 }}>Profile</Typography>
      </Box>
    </Sheet>
  );
}
