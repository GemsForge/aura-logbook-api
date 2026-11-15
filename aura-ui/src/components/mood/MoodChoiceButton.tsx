import { AuraButton } from "@/components/ui/AuraButton";
import { MoodIcon } from "./MoodIcon";
import { getMoodPillSx } from "./moodPillStyles";

/** Shared compact mood control (44px minimum touch target): quick check-ins act immediately; form choices expose their toggle state. */
export function MoodChoiceButton({ label, icon, color, selected, disabled = false, onClick, describedBy }: {
  label: string; icon?: string; color: string; selected?: boolean;
  disabled?: boolean; onClick: () => void; describedBy?: string;
}) {
  return <AuraButton type="button" size="sm" variant="soft" color="neutral" disabled={disabled}
    aria-label={label} aria-pressed={selected} aria-describedby={describedBy} onClick={onClick} data-mood-color={color}
    sx={{ ...getMoodPillSx(color, { selected: selected === true, interactive: true }), flexShrink: 0, display: "inline-flex", alignItems: "center", gap: .5, px: 1, py: .25, minHeight: 44, borderRadius: "sm", borderWidth: selected ? 2 : 1, whiteSpace: "nowrap" }}>
    <MoodIcon icon={icon} size={20} />{label}
  </AuraButton>;
}
