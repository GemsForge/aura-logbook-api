import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { useGetCurrentAuraQuery } from "@/store/auraApi";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { WhyThisColor } from "./WhyThisColor";

/** Reuses Today's orb and explanation for the saved, check-in-derived aura; hidden when reveals are off or no aura exists. */
export function CurrentAuraMark({ showExplanation = false }: { showExplanation?: boolean }) {
  const user = useAppSelector(selectCurrentUser);
  const enabled = Boolean(user) && user?.auraRevealsEnabled !== false;
  const { data: aura } = useGetCurrentAuraQuery(undefined, { skip: !enabled });
  if (!enabled || aura?.hue == null) return null;
  return <Box role="group" aria-label="Your current aura" data-testid="current-aura-mark" sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, py: .5 }}>
    <Box role="img" aria-label="Current aura color" className="aura-orb" sx={{ width: 36, flexShrink: 0, mx: .75, boxShadow: "inset -6px -8px 14px rgba(34,44,39,.12), inset 3px 3px 8px rgba(255,255,255,.75), 0 6px 20px var(--aura-glow)" }} />
    {showExplanation ? <WhyThisColor /> : <Typography level="body-xs" color="neutral">Your current aura</Typography>}
  </Box>;
}
