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
  { label: "Insights", path: "/insights", icon: InsightsOutlined },
  { label: "Log mood", path: "/log-mood", icon: EditNoteOutlined },
  { label: "Reflections", path: "/history", icon: MenuBookOutlined },
  { label: "Gallery", path: "/gallery", icon: PhotoLibraryOutlined },
];

/** Hides text visually but keeps it as the item's accessible name for screen readers and tests. */
/** Theme-derived wash so hover/active states follow the interface theme, not the aura reveal tint. */
const themeWash = "color-mix(in srgb, var(--al-theme-primary) 14%, transparent)";

const visuallyHidden = {
  position: "absolute", width: 1, height: 1, p: 0, m: -1, overflow: "hidden",
  clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0,
} as const;

/**
 * Keeps journal destinations and profile access within thumb reach above the device safe area.
 * Icon-only on phones so six items never crowd; labels remain as visually hidden accessible names,
 * and the active item is marked by its wash plus `aria-current`, not by color alone. The border
 * uses the interface theme border token so it follows the chosen theme rather than the aura.
 */
export default function MobileNavigation() {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const profileOpen = useAppSelector(selectIsProfileModalOpen);
  const itemStyles = {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    position: "relative", minHeight: 52, minWidth: 0, px: 0.5, borderRadius: "lg", color: "neutral.700",
    textDecoration: "none", border: 0, background: "transparent", cursor: "pointer",
    "&:hover": { backgroundColor: themeWash },
    "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 },
  };

  return (
    <Sheet component="nav" aria-label="Mobile journal navigation" sx={{
      display: { xs: "grid", md: "none" }, gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
      position: "fixed", left: 12, right: 12, bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
      zIndex: 1050, p: 0.5, borderRadius: "xl", border: "1px solid var(--al-theme-border)",
      backgroundColor: "color-mix(in srgb, var(--al-theme-surface) 92%, transparent)", backdropFilter: "blur(24px)",
      boxShadow: "0 8px 32px var(--al-theme-glow)",
    }}>
      {destinations.map(({ label, path, icon: Icon }) => {
        const active = pathname === path && !profileOpen;
        return <Box key={path} component={Link} to={path} aria-current={active ? "page" : undefined}
          sx={{ ...itemStyles, backgroundColor: active ? themeWash : "transparent" }}>
          <Icon aria-hidden="true" sx={{ fontSize: 26 }} />
          <Typography component="span" sx={visuallyHidden}>{label}</Typography>
        </Box>;
      })}
      <Box component="button" type="button" aria-haspopup="dialog" aria-expanded={profileOpen}
        onClick={() => dispatch(openProfileModal())}
        sx={{ ...itemStyles, backgroundColor: profileOpen ? themeWash : "transparent" }}>
        <PersonOutline aria-hidden="true" sx={{ fontSize: 26 }} />
        <Typography component="span" sx={visuallyHidden}>Profile</Typography>
      </Box>
    </Sheet>
  );
}
