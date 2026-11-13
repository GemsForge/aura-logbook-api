import Stack from "@mui/joy/Stack";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { Link, useLocation } from "react-router-dom";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import EditNoteOutlined from "@mui/icons-material/EditNoteOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import InsightsOutlined from "@mui/icons-material/InsightsOutlined";
import PhotoLibraryOutlined from "@mui/icons-material/PhotoLibraryOutlined";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import SelfImprovementOutlined from "@mui/icons-material/SelfImprovementOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import { PATHWAY_MODULES, pathwayModuleKey } from "@/features/pathways/pathwayResources";

const navItems = [
  { label: "Today", path: "/dashboard", icon: HomeOutlined },
  { label: "Log mood", path: "/log-mood", icon: EditNoteOutlined },
  { label: "Reflections", path: "/history", icon: MenuBookOutlined },
  { label: "Gallery", path: "/gallery", icon: PhotoLibraryOutlined },
  { label: "Insights", path: "/insights", icon: InsightsOutlined },
];

/** Keeps journal destinations in a translucent rail that reflows below mobile content. */
const Sidebar = () => {
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);
  const pathway = pathwayModuleKey(user?.selectedPathway);
  const preferences = user?.pathwayPreferences;
  const modules = pathway ? PATHWAY_MODULES[pathway].filter((module) => preferences?.focus.includes(module.key)) : [];
  const showBreathing = preferences?.breathingEnabled !== false;
  // Each destination is its own route, so the current page is a plain path match.
  const isCurrentDestination = (path: string) => location.pathname === path;

  return (
    <Stack component="nav" aria-label="Journal navigation" spacing={1} sx={{ p: 1, mt: { xs: 1, md: 2 }, position: { md: "sticky" }, top: { md: 112 }, borderRadius: "lg", backgroundColor: "color-mix(in srgb, var(--al-theme-surface) 54%, transparent)" }}>
      <Typography className="aura-eyebrow" level="body-xs" sx={{ px: 1.5, py: 1, color: "neutral.500" }}>
        Your logbook
      </Typography>
      {navItems.map(({ label, path, icon: Icon }) => {
        const isCurrent = isCurrentDestination(path);
        return (
          <Sheet
            component={Link}
            to={path}
            variant="plain"
            aria-current={isCurrent ? "page" : undefined}
            key={label}
            sx={{
              bgcolor: isCurrent ? "var(--aura-wash)" : "transparent",
              border: "1px solid",
              borderColor: isCurrent ? "var(--aura-line)" : "transparent",
              borderRadius: "md",
              transition: "background-color 0.2s, border-color 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              textDecoration: "none",
              "&:hover": { bgcolor: "var(--aura-wash)", borderColor: "var(--aura-line)" },
            }}
          >
            <Icon sx={{ ml: 1.25, color: isCurrent ? "primary.700" : "neutral.500", fontSize: 20 }} />
            <Typography level="title-md" sx={{ py: 1.25, fontWeight: isCurrent ? 700 : 500, color: "neutral.800" }}>
              {label}
            </Typography>
          </Sheet>
        );
      })}
      {(showBreathing || modules.length > 0) && <Box component="section" aria-label="Your pathway modules" sx={{ mt: 1.5, pt: 1.25, borderTop: "1px solid var(--al-theme-border)" }}>
        <Typography className="aura-eyebrow" level="body-xs" sx={{ px: 1.5, py: 1, color: "neutral.500" }}>{pathway === "mindfulness" ? "Mindful Living" : pathway === "energy" ? "Astrology & Energy" : pathway === "faith" ? "Faith & Religion" : "Your Pathway"}</Typography>
        {showBreathing && <PathwayLink label="Breathing" path="/pathways/breathing" active={location.pathname === "/pathways/breathing"} icon={SelfImprovementOutlined} />}
        {modules.map((module) => <PathwayLink key={module.key} label={module.label} path={module.path} active={location.pathname === module.path} icon={pathway === "energy" ? AutoAwesomeOutlined : MenuBookOutlinedIcon} />)}
      </Box>}
    </Stack>
  );
};

/** A compact nested pathway destination that shares the primary journal rail styles. */
function PathwayLink({ label, path, active, icon: Icon }: { label: string; path: string; active: boolean; icon: typeof SelfImprovementOutlined }) {
  return <Sheet component={Link} to={path} variant="plain" aria-current={active ? "page" : undefined} sx={{
    ml: 1, minHeight: 36, display: "flex", alignItems: "center", gap: 1, pl: 1.25, pr: 1,
    borderLeft: "1px solid var(--al-theme-border)", color: "neutral.700", textDecoration: "none",
    bgcolor: active ? "var(--aura-wash)" : "transparent", borderRadius: "sm",
    "&:hover": { bgcolor: "var(--aura-wash)" },
  }}>
    <Icon aria-hidden="true" sx={{ fontSize: 17, color: active ? "primary.700" : "neutral.500" }} />
    <Typography level="body-sm" sx={{ fontWeight: active ? 700 : 500 }}>{label}</Typography>
  </Sheet>;
}

export default Sidebar;
