import { getAuraJoyTheme, getAuraTheme } from "./index";
import { interfaceThemes, interfaceThemeTokens } from "./interfaceThemes";

describe("interface theme adapters", () => {
  it.each(interfaceThemes)("applies the %s token set to Material and Joy", (name) => {
    const tokens = interfaceThemeTokens[name];
    const material = getAuraTheme("rose", 35, name);
    const joy = getAuraJoyTheme(name);

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

    expect(rose.palette.primary.main).toBe(interfaceThemeTokens.Ocean.primary);
    expect(blue.palette.primary.main).toBe(interfaceThemeTokens.Ocean.primary);
    expect(rose.palette.background.default).toBe(blue.palette.background.default);
    expect(rose.palette.text.primary).toBe(blue.palette.text.primary);
    expect(JSON.stringify(rose.components?.MuiCssBaseline?.styleOverrides))
      .not.toBe(JSON.stringify(blue.components?.MuiCssBaseline?.styleOverrides));
  });

  it("defaults missing and unsupported saved preferences to Aurora", () => {
    expect(getAuraTheme().palette.background.default).toBe(interfaceThemeTokens.Aurora.canvas);
    expect(getAuraTheme("blue", 50, "not-a-theme").palette.primary.main)
      .toBe(interfaceThemeTokens.Aurora.primary);
    expect(getAuraJoyTheme("not-a-theme").colorSchemes.dark.palette.background.body)
      .toBe(interfaceThemeTokens.Aurora.canvas);
  });
});
