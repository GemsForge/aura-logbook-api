import { useState } from "react";
import Link from "@mui/joy/Link";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import Typography from "@mui/joy/Typography";
import { AuraModal } from "@/components/ui/AuraModal";
import { useGetCurrentAuraQuery } from "@/store/auraApi";
import { useGetCurrentUserQuery } from "@/store/authApi";

/**
 * "Why this color?" (#344): a link that opens a sheet listing, in plain words, what fed the
 * current aura. Hidden when aura reveals are off. Copy stays non-diagnostic ("often linked with…", never "you are…").
 */
export function WhyThisColor() {
  const [open, setOpen] = useState(false);
  const { data: user } = useGetCurrentUserQuery();
  const enabled = !!user && user.auraRevealsEnabled !== false;
  const { data: aura } = useGetCurrentAuraQuery(undefined, { skip: !enabled });
  if (!enabled) return null;
  const contributors = aura?.contributors ?? [];
  return (
    <>
      <Link component="button" onClick={() => setOpen(true)} sx={{ minHeight: 44 }}>Why this color?</Link>
      <AuraModal open={open} onClose={() => setOpen(false)} title="Why this color?">
        {contributors.length === 0 ? (
          <Typography level="body-md">Your aura appears once you check in. It's a reflection that shifts with you, never a label.</Typography>
        ) : (
          <>
            <Typography level="title-sm">Shaped by</Typography>
            <List marker="disc">
              {contributors.map((c) => <ListItem key={c}>{c}</ListItem>)}
            </List>
            <Typography level="body-sm" color="neutral">Recent check-ins count most. A reflection, never a label.</Typography>
          </>
        )}
      </AuraModal>
    </>
  );
}
