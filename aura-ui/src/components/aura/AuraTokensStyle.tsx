import GlobalStyles from "@mui/material/GlobalStyles";
import { useGetCurrentAuraQuery } from "@/store/auraApi";
import { breathSeconds, deriveAuraTokens } from "@/theme/auraTokens";
import { getInterfaceThemeTokens, type InterfaceTheme, type InterfaceMode } from "@/theme/interfaceThemes";

interface Props {
  interfaceTheme: InterfaceTheme;
  /** Current display brightness changes contrast surfaces, never the derived hue. */
  interfaceMode: InterfaceMode;
  /** False when the user turned aura reveals off, or is signed out. */
  enabled: boolean;
}

/**
 * Applies the derived aura (#343) to the app's accent variables (#344). Colors come from
 * `deriveAuraTokens`, so text and buttons always pass contrast against the interface theme.
 * When reveals are off or there is no aura yet, nothing is overridden and the theme accents remain.
 */
export function AuraTokensStyle({ interfaceTheme, interfaceMode, enabled }: Props) {
  const { data: aura } = useGetCurrentAuraQuery(undefined, { skip: !enabled, refetchOnMountOrArgChange: true });
  if (!enabled || aura?.hue == null) return null;
  const { mode, canvas } = getInterfaceThemeTokens(interfaceTheme, interfaceMode);
  const t = deriveAuraTokens(aura.hue, aura.chroma, mode, canvas);
  return (
    <GlobalStyles
      styles={{
        ":root": {
          "--aura-accent": t.surface,
          "--aura-glow": `${t.surface}66`,
          "--aura-wash": `${t.surface}24`,
          "--aura-line": `${t.surface}4d`,
          "--aura-tint": t.tint,
          "--aura-button": t.accent,
          "--aura-on-button": t.onAccent,
          "--aura-text": t.text,
          // #347: the orb breathes faster when the aura is strong.
          "--aura-breath": `${breathSeconds(aura.strength)}s`,
        },
        // Primary buttons take the aura accent; text color is the contrast-checked on-accent.
        ".MuiButton-variantSolid.MuiButton-colorPrimary:not(:disabled)": {
          backgroundColor: "var(--aura-button)",
          color: "var(--aura-on-button)",
        },
        ".MuiButton-variantSolid.MuiButton-colorPrimary:not(:disabled):hover": {
          backgroundColor: "var(--aura-button)",
          filter: "brightness(1.08)",
        },
      }}
    />
  );
}
