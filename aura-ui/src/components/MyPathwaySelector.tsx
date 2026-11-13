import { Box, Checkbox, FormControl, FormControlLabel, FormHelperText, Radio, RadioGroup, Switch, TextField, Typography } from "@mui/material";
import Sheet from "@mui/joy/Sheet";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller, useWatch, type UseFormSetValue } from "react-hook-form";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import type { PathwayPreferences } from "@/features/auth/models/Auth";
import { PATHWAY_MODULES } from "@/features/pathways/pathwayResources";

type PathwayField = { spiritualPathway: string; pathwayPreferences: PathwayPreferences };
/** Lets a user choose one pathway and configure its modules in the Profile step. */
export function MyPathwaySelector<TForm extends FieldValues & PathwayField>({
  control,
  setValue,
  name,
  errorMessage,
}: {
  control: Control<TForm>;
  name?: Path<TForm>;
  setValue: UseFormSetValue<TForm>;
  errorMessage?: string;
}) {
  const { data, isError } = useGetReferenceDataQuery();
  const selected = useWatch({ control, name: (name ?? ("spiritualPathway" as Path<TForm>)) as Path<TForm> }) as string;
  const preferences = useWatch({ control, name: "pathwayPreferences" as Path<TForm> }) as PathwayPreferences;
  const modules = PATHWAY_MODULES[selected as keyof typeof PATHWAY_MODULES] ?? [];

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Typography variant="body2" color="text.secondary">Choose one primary pathway. Its modules appear in your navigation.</Typography>
      {!data || isError ? <FormHelperText error role="alert">Pathway choices are unavailable. Reload to try again.</FormHelperText> : (
        <Controller
          name={(name ?? ("spiritualPathway" as Path<TForm>)) as Path<TForm>}
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} aria-label="Choose your pathway" value={field.value || ""} onChange={(_, value) => {
              field.onChange(value);
              const allowed = new Set((PATHWAY_MODULES[value as keyof typeof PATHWAY_MODULES] ?? []).map((module) => module.key));
              setValue("pathwayPreferences" as Path<TForm>, { ...preferences, focus: [...allowed] } as TForm[keyof TForm], { shouldDirty: true });
            }}>
              {data.pathways.map((pathway) => (
                <Box key={pathway.key} sx={{ borderBottom: "1px solid var(--al-theme-border)", py: 1 }}>
                  <FormControlLabel value={pathway.key} control={<Radio size="small" />} label={<Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{pathway.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">{pathway.description}</Typography>
                  </Box>} />
                  {field.value === pathway.key && <Box sx={{ pl: 4.5, pt: 1 }}>
                    <Typography variant="overline" sx={{ letterSpacing: ".12em" }}>Modules</Typography>
                    <Controller name={"pathwayPreferences" as Path<TForm>} control={control} render={({ field: preferenceField }) => {
                      const value = preferenceField.value as PathwayPreferences;
                      const focus = value.focus ?? [];
                      return <>
                        {modules.map((module) => <Box key={module.key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, py: .5 }}>
                          <Box><Typography variant="body2">{module.label}</Typography>{module.hint && <Typography variant="caption" color="text.secondary">{module.hint}</Typography>}</Box>
                          <Switch size="small" checked={focus.includes(module.key)} onChange={(event) => preferenceField.onChange({ ...value, focus: event.target.checked ? [...focus, module.key] : focus.filter((key) => key !== module.key) })} inputProps={{ "aria-label": `Show ${module.label}` }} />
                        </Box>)}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: .5 }}>
                          <Box><Typography variant="body2">Breathing timer</Typography><Typography variant="caption" color="text.secondary">Shared practice</Typography></Box>
                          <Switch size="small" checked={value.breathingEnabled !== false} onChange={(event) => preferenceField.onChange({ ...value, breathingEnabled: event.target.checked })} inputProps={{ "aria-label": "Show breathing timer" }} />
                        </Box>
                        {selected === "energy" && <BirthDetailsFields control={control} />}
                        {selected === "faith" && <FaithFrameworkField control={control} />}
                      </>;
                    }} />
                  </Box>}
                </Box>
              ))}
            </RadioGroup>
          )}
        />
      )}
      {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
    </Box>
  );
}

/** Stores chart details only when the explicit save choice is on. */
function BirthDetailsFields<TForm extends FieldValues & PathwayField>({ control }: { control: Control<TForm> }) {
  return <Controller name={"pathwayPreferences" as Path<TForm>} control={control} render={({ field }) => {
    const preferences = field.value as PathwayPreferences;
    const save = preferences.saveBirthDetails === true;
    return <Sheet variant="soft" sx={{ mt: 1, p: 1.25, borderRadius: 4 }}>
      <FormControlLabel control={<Checkbox size="small" checked={save} onChange={(event) => field.onChange({ ...preferences, saveBirthDetails: event.target.checked, birthTime: event.target.checked ? preferences.birthTime : "", birthPlace: event.target.checked ? preferences.birthPlace : "" })} />} label={<Typography variant="body2">Save optional birth details</Typography>} />
      {save && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, mt: .5 }}>
        <TextField size="small" label="Birth time" type="time" value={preferences.birthTime ?? ""} onChange={(event) => field.onChange({ ...preferences, birthTime: event.target.value })} InputLabelProps={{ shrink: true }} />
        <TextField size="small" label="Birthplace" value={preferences.birthPlace ?? ""} onChange={(event) => field.onChange({ ...preferences, birthPlace: event.target.value })} />
      </Box>}
      <FormHelperText>Birthday alone can provide a sun-sign reading.</FormHelperText>
    </Sheet>;
  }} />;
}

/** Keeps sacred-text content and links tied to a framework the user explicitly selected. */
function FaithFrameworkField<TForm extends FieldValues & PathwayField>({ control }: { control: Control<TForm> }) {
  return <Controller name={"pathwayPreferences" as Path<TForm>} control={control} render={({ field }) => {
    const preferences = field.value as PathwayPreferences;
    return <FormControl fullWidth size="small" sx={{ mt: 1 }}>
      <TextField select size="small" label="Framework" value={preferences.faithTradition ?? ""} onChange={(event) => field.onChange({ ...preferences, faithTradition: event.target.value || null })} SelectProps={{ native: true }}>
        <option value="">No framework selected</option><option value="christian">Christian</option><option value="muslim">Muslim</option><option value="jewish">Jewish</option><option value="other">Another tradition</option><option value="custom">My own wording</option><option value="neutral">Neutral reflection</option>
      </TextField>
      <FormHelperText>Only the chosen framework’s sacred text and reading link appear.</FormHelperText>
    </FormControl>;
  }} />;
}
