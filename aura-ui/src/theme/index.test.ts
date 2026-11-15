import { getAuraJoyTheme, getAuraTheme } from "./index";
import { getInterfaceThemeTokens, interfaceThemes, interfaceThemeTokens } from "./interfaceThemes";

describe("interface theme adapters", () => {
  it.each(interfaceThemes)("applies the %s token set to Material and Joy", (name) => {
    const tokens = interfaceThemeTokens[name];
    const material = getAuraTheme("rose", 35, name, "dark");
    const joy = getAuraJoyTheme(name, undefined, undefined, "dark");

    expect(material.palette.mode).toBe(tokens.mode);
    expect(material.palette.primary.main).toBe(tokens.primary);
    expect(material.palette.background.default).toBe(tokens.canvas);
    expect(material.palette.background.paper).toBe(tokens.surface);
    expect(joy.colorSchemes[tokens.mode].palette.background.body).toBe(tokens.canvas);
    expect(joy.colorSchemes[tokens.mode].palette.focusVisible).toBe(tokens.focus);
  });

  it("keeps the interface theme independent from recorded aura color", () => {
    const rose = getAuraTheme("rose", 35, "Ocean");
    const blue = getAuraTheme("blue", 90, "Ocean");

    expect(rose.palette.primary.main).toBe(getInterfaceThemeTokens("Ocean", "light").primary);
    expect(blue.palette.primary.main).toBe(getInterfaceThemeTokens("Ocean", "light").primary);
    expect(rose.palette.background.default).toBe(blue.palette.background.default);
    expect(rose.palette.text.primary).toBe(blue.palette.text.primary);
    expect(JSON.stringify(rose.components?.MuiCssBaseline?.styleOverrides))
      .not.toBe(JSON.stringify(blue.components?.MuiCssBaseline?.styleOverrides));
  });

  it.each(interfaceThemes)("keeps %s module selection text readable through interaction states", (name) => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = getInterfaceThemeTokens(name, mode);
      const themePalette = getAuraJoyTheme(name, undefined, undefined, mode).colorSchemes[tokens.mode].palette;
      const palette = themePalette.neutral;
      expect(palette).toMatchObject({
        softHoverColor: tokens.ink, softActiveColor: tokens.ink,
        plainHoverColor: tokens.ink, plainActiveColor: tokens.ink,
        plainHoverBg: tokens.surfaceRaised, plainActiveBg: tokens.surfaceRaised,
      });
      expect(themePalette.primary).toMatchObject({ softHoverColor: tokens.ink, softActiveColor: tokens.ink });
    }
  });

  it("defaults missing and unsupported saved preferences to Aurora light", () => {
    expect(getAuraTheme().palette.background.default).toBe(getInterfaceThemeTokens("Aurora", "light").canvas);
    expect(getAuraTheme("blue", 50, "not-a-theme").palette.primary.main)
      .toBe(getInterfaceThemeTokens("Aurora", "light").primary);
    expect(getAuraJoyTheme("not-a-theme").colorSchemes.dark.palette.background.body)
      .toBe(getInterfaceThemeTokens("Aurora", "light").canvas);
  });
  it("keeps outlined neutral controls readable on hover in every scheme", () => {
    for (const mode of ["light", "dark"] as const) {
      const theme = getAuraJoyTheme("not-a-theme", undefined, undefined, mode);
      const neutral = theme.colorSchemes[mode].palette.neutral;
      expect(neutral.outlinedHoverBg).toBe(neutral[100]);
      expect(neutral.outlinedHoverColor).toBe(theme.colorSchemes[mode].palette.text.primary);
    }
  });
});
