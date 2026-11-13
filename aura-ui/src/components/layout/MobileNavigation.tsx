import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import SelfImprovementOutlined from "@mui/icons-material/SelfImprovementOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openProfileModal, selectIsProfileModalOpen } from "@/store/slices/uiSlice";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { PATHWAY_MODULES, pathwayModuleKey } from "@/features/pathways/pathwayResources";

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
 * Keeps core destinations icon-only and places enabled pathway modules in a separate, scrollable
 * row above them. Accessible names remain available to assistive technology; active destinations
 * use both a theme wash and `aria-current`.
 */
export default function MobileNavigation() {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const profileOpen = useAppSelector(selectIsProfileModalOpen);
  const user = useAppSelector(selectCurrentUser);
  const pathway = pathwayModuleKey(user?.selectedPathway);
  const preferences = user?.pathwayPreferences;
  const pathwayModules = pathway ? PATHWAY_MODULES[pathway].filter((module) => preferences?.focus.includes(module.key)) : [];
  const showBreathing = preferences?.breathingEnabled !== false;
  const itemStyles = {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    position: "relative", minHeight: 52, minWidth: 0, px: 0.5, borderRadius: "lg", color: "neutral.700",
    textDecoration: "none", border: 0, background: "transparent", cursor: "pointer",
    "&:hover": { backgroundColor: themeWash },
    "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 },
  };

  return (
    <>
    <Sheet component="nav" aria-label="Mobile journal navigation" sx={{
      display: { xs: "grid", md: "none" }, gridTemplateColumns: `repeat(${destinations.length + 1}, minmax(44px, 1fr))`, overflowX: "auto",
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
    {pathway && (showBreathing || pathwayModules.length > 0) && <Sheet component="nav" aria-label={`${pathway} pathway modules`} sx={{
      display: { xs: "flex", md: "none" }, gap: .5, overflowX: "auto", whiteSpace: "nowrap",
      position: "fixed", left: 12, right: 12, bottom: "calc(74px + env(safe-area-inset-bottom, 0px))", zIndex: 1049,
      px: .75, py: .5, borderRadius: "md", border: "1px solid var(--al-theme-border)",
      backgroundColor: "color-mix(in srgb, var(--al-theme-surface) 95%, transparent)",
    }}>
      {showBreathing && <Box component={Link} to="/pathways/breathing" sx={{ px: 1.25, py: .75, borderRadius: "sm", color: "inherit", textDecoration: "none", bgcolor: pathname === "/pathways/breathing" ? themeWash : "transparent" }}>
        <SelfImprovementOutlined sx={{ fontSize: 16, verticalAlign: "middle", mr: .5 }} /><Typography component="span" level="body-xs">Breathing</Typography>
      </Box>}
      {pathwayModules.map((module) => <Box key={module.key} component={Link} to={module.path} aria-current={pathname === module.path ? "page" : undefined} sx={{ px: 1.25, py: .75, borderRadius: "sm", color: "inherit", textDecoration: "none", bgcolor: pathname === module.path ? themeWash : "transparent" }}>
        <AutoAwesomeOutlined sx={{ fontSize: 16, verticalAlign: "middle", mr: .5 }} /><Typography component="span" level="body-xs">{module.label}</Typography>
      </Box>)}
    </Sheet>}
    </>
  );
}
