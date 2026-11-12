import { useState } from "react";
import Box from "@mui/joy/Box";
import Link from "@mui/joy/Link";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Typography from "@mui/joy/Typography";
import { AuraModal } from "@/components/ui/AuraModal";
import { useGetCurrentAuraQuery } from "@/store/auraApi";
import { useGetCurrentUserQuery } from "@/store/authApi";

/**
 * Explains the visible check-in-derived color with its current swatch and plain-language contributors.
 * Hidden when aura reveals are off; the displayed color is a reflection, not a diagnosis or identity.
 */
export function WhyThisColor() {
  const [open, setOpen] = useState(false);
  const { data: user } = useGetCurrentUserQuery();
  const enabled = !!user && user.auraRevealsEnabled !== false;
  const { data: aura } = useGetCurrentAuraQuery(undefined, { skip: !enabled });
  if (!enabled) return null;
  const contributors = aura?.contributors ?? [];
  const color = aura?.hue == null ? undefined : `oklch(${aura.lightness} ${aura.chroma} ${aura.hue})`;
  return (
    <>
      <Link component="button" onClick={() => setOpen(true)} sx={{ minHeight: 44 }}>Why this color?</Link>
      <AuraModal open={open} onClose={() => setOpen(false)} title="Today’s color">
        {color && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box aria-label="Current reflected color" role="img" sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: color, border: "1px solid", borderColor: "divider" }} />
            <Typography level="body-sm" color="neutral">The color currently reflected in your space</Typography>
          </Box>
        )}
        {contributors.length === 0 ? (
          <Typography level="body-md">Your color takes shape as you check in and can shift with what you record.</Typography>
        ) : (
          <>
            <Typography level="title-sm">What contributes to it</Typography>
            <List marker="disc">
              {contributors.map((c) => <ListItem key={c}>{c}</ListItem>)}
            </List>
            <Typography level="body-sm" color="neutral">Recent check-ins have the strongest influence. This is a reflection, not a label.</Typography>
          </>
        )}
      </AuraModal>
    </>
  );
}
