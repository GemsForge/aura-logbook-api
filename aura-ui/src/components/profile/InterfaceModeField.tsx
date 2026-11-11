import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";
import { interfaceModes, type InterfaceMode } from "@/features/auth/models/InterfaceTheme";

/** Profile brightness choice; theme family, aura color, and intensity remain separate fields. */
export function InterfaceModeField({ value, onChange }: { value: InterfaceMode; onChange: (mode: InterfaceMode) => void }) {
  return <FormControl component="fieldset"><FormLabel component="legend" id="interface-mode-label">Screen mode</FormLabel>
    <RadioGroup row aria-labelledby="interface-mode-label" name="interfaceMode" value={value} onChange={(event) => onChange(event.target.value as InterfaceMode)}>
      {interfaceModes.map((mode) => <FormControlLabel key={mode} value={mode} control={<Radio />} label={mode === "light" ? "Light" : "Dark"} />)}
    </RadioGroup>
  </FormControl>;
}
