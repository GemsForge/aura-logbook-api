import Box from "@mui/joy/Box";
import { tapTarget44 } from "@/components/ui/tapTarget";

/** Props for {@link SegmentedToggle}. */
export interface SegmentedToggleProps<T extends string> {
  /** Accessible name for the group, e.g. "Insights period". */
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  /** Optional id of the region the choice controls (sets aria-controls on each option). */
  controls?: string;
  size?: "sm" | "md";
}

/**
 * The shared pill-shaped segmented control (Insights period, calendar Week/Month). Each option is a toggle
 * button with aria-pressed; the selected one inverts theme ink and surface so it reads in light and dark
 * themes, every option keeps a visible focus ring, and a 44px invisible hit area keeps touch targets usable.
 */
export default function SegmentedToggle<T extends string>({ label, options, value, onChange, controls, size = "md" }: SegmentedToggleProps<T>) {
  return (
    <Box role="group" aria-label={label} sx={{ display: "inline-flex", gap: "2px", p: "3px", borderRadius: 999, border: "1px solid var(--al-theme-control-border, var(--al-theme-border))", bgcolor: "var(--al-theme-surface)" }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Box key={option.value} component="button" type="button" aria-pressed={selected} aria-controls={controls} onClick={() => onChange(option.value)}
            sx={{
              ...tapTarget44, border: 0, borderRadius: 999, cursor: "pointer", font: "inherit", fontWeight: 600,
              px: size === "sm" ? 1.25 : 1.75, minHeight: size === "sm" ? 28 : 32, fontSize: size === "sm" ? "0.78rem" : "0.85rem",
              bgcolor: selected ? "var(--al-theme-ink)" : "transparent",
              color: selected ? "var(--al-theme-surface)" : "var(--al-theme-ink)",
              "&:hover": selected ? undefined : { bgcolor: "var(--al-theme-surface-raised)" },
              "&:focus-visible": { outline: "2px solid var(--al-theme-focus)", outlineOffset: 2 },
            }}>
            {option.label}
          </Box>
        );
      })}
    </Box>
  );
}
