import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/** One group of Edit Profile fields. `id` is stable and used for error routing. */
export interface ProfileSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface ProfileSectionsProps {
  sections: ProfileSection[];
  /** Sections open on first render in the phone accordion layout. */
  defaultExpanded: string[];
  /** Section the parent wants revealed (e.g. it holds the first validation error). */
  reveal?: { id: string; nonce: number };
  /** Rendered above the section navigation on desktop. */
  navHeader?: ReactNode;
}

/**
 * Lays out profile sections as accordions below `md` and as a vertical tab nav with one
 * visible panel at `md` and up. Every section stays mounted in both layouts so
 * react-hook-form keeps registered values and validation for hidden fields.
 */
export function ProfileSections({ sections, defaultExpanded, reveal, navHeader }: ProfileSectionsProps) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("md"));
  const [expanded, setExpanded] = useState<string[]>(defaultExpanded);
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const [seenNonce, setSeenNonce] = useState(0);

  // Reveal requests are applied during render (not an effect) so the error is visible immediately.
  if (reveal && reveal.nonce !== seenNonce) {
    setSeenNonce(reveal.nonce);
    setActive(reveal.id);
    if (!expanded.includes(reveal.id)) setExpanded([...expanded, reveal.id]);
  }

  if (isPhone) {
    return (
      <Box sx={{ minWidth: 0 }}>
        {sections.map((section) => {
          const open = expanded.includes(section.id);
          return (
            <Accordion
              key={section.id}
              disableGutters
              elevation={0}
              expanded={open}
              onChange={() => setExpanded(open ? expanded.filter((id) => id !== section.id) : [...expanded, section.id])}
              slotProps={{ transition: { unmountOnExit: false } }}
              sx={{ bgcolor: "transparent", borderTop: "1px solid var(--aura-line)", "&::before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} id={`profile-${section.id}-header`} aria-controls={`profile-${section.id}-panel`}>
                <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 700 }}>{section.title}</Typography>
              </AccordionSummary>
              <AccordionDetails id={`profile-${section.id}-panel`} sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                {section.content}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "180px minmax(0, 1fr)", minHeight: 420 }}>
      <Box sx={{ borderRight: "1px solid var(--aura-line)", py: 2, pr: 1 }}>
        {navHeader}
        <Tabs
          orientation="vertical"
          value={active}
          onChange={(_, id: string) => setActive(id)}
          aria-label="Profile sections"
          sx={{ "& .MuiTab-root": { alignItems: "flex-start", textTransform: "none", minHeight: 40, px: 1.5 } }}>
          {sections.map((section) => (
            <Tab key={section.id} value={section.id} label={section.title} id={`profile-${section.id}-tab`} aria-controls={`profile-${section.id}-panel`} />
          ))}
        </Tabs>
      </Box>
      {sections.map((section) => (
        <Box
          key={section.id}
          role="tabpanel"
          id={`profile-${section.id}-panel`}
          aria-labelledby={`profile-${section.id}-tab`}
          hidden={active !== section.id}
          sx={{ p: 3, minWidth: 0, flexDirection: "column", gap: 2, display: active === section.id ? "flex" : "none" }}>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>{section.title}</Typography>
          {section.content}
        </Box>
      ))}
    </Box>
  );
}
