import { useRef } from "react";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { MoodChoiceButton } from "./MoodChoiceButton";
import type { MoodDefinition } from "@/store/referenceDataApi";
import type { AuraColorDefinition } from "@/features/mood/models/aura";
import type { MoodType } from "@/features/mood/models/schema/MoodType";

/** Preserves the mood catalog and illustrations in a keyboard- and touch-scrollable horizontal track. */
export function MoodChoiceCarousel({ moods, auras, selected, onToggle, disabled, error }: {
  moods: MoodDefinition[]; auras: AuraColorDefinition[]; selected: MoodType[];
  onToggle: (mood: MoodType) => void; disabled: boolean; error?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (direction: number) => track.current?.scrollBy({ left: direction * track.current.clientWidth * .8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  return <Box sx={{ minWidth: 0, display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) 44px", alignItems: "center", gap: .25 }}>
      <IconButton size="sm" variant="plain" type="button" aria-label="Previous emotions" disabled={disabled} onClick={() => scroll(-1)} sx={{ minWidth: 44, minHeight: 44 }}><ChevronLeftRounded /></IconButton>
    <Box ref={track} role="group" aria-label="Choose one or more moods" tabIndex={0} data-testid="mood-carousel" sx={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: .75, width: "100%", minWidth: 0, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "thin", py: .75, px: .25 }}>
        {moods.map((moodDefinition) => {
          const mood = moodDefinition.key;
          const checked = selected.includes(mood);
          const moodAura = auras.find((aura) => aura.key === moodDefinition.auraColorKeys[0]);
          const moodHue = moodAura?.shades?.[500] ?? moodAura?.baseHex ?? "var(--al-theme-primary)";
          return <MoodChoiceButton key={mood} label={moodDefinition.displayName} icon={moodDefinition.icon} color={moodHue}
            selected={checked} disabled={disabled} onClick={() => onToggle(mood)} describedBy={error ? "mood-error" : undefined} />;
        })}
    </Box>
    <IconButton size="sm" variant="plain" type="button" aria-label="Next emotions" disabled={disabled} onClick={() => scroll(1)} sx={{ minWidth: 44, minHeight: 44 }}><ChevronRightRounded /></IconButton>
  </Box>;
}
