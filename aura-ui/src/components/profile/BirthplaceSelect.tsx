import { useEffect, useState } from "react";
import { Autocomplete, createFilterOptions, Box, Button, FormHelperText, TextField, Typography } from "@mui/material";
import { getCities, getCountries, getStatesByShort } from "countrycitystatejson/client";

const countries = getCountries().filter((item) => item.name && item.shortName)
  .map((item) => ({ name: item.name!, shortName: item.shortName! }))
  .sort((a, b) => a.name.localeCompare(b.name));
// Search the full catalog while keeping the rendered menu bounded for large regions.
const filterCities = createFilterOptions<string>({ limit: 100 });

/** Preset-only chart location picker; existing saved text survives until a replacement is selected. */
export function BirthplaceSelect({ value, onChange, error }: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [editing, setEditing] = useState(!value);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const states = country ? (getStatesByShort(country) ?? []) : [];

  useEffect(() => {
    // Ignore a previous country's response after changing the upstream selection or unmounting.
    let active = true;
    setCities([]);
    setFailed(false);
    setLoading(!!country && !!region);
    if (country && region) {
      getCities(country, region).then((items) => {
        if (active) setCities([...new Set(items ?? [])].sort((a, b) => a.localeCompare(b)));
      }).catch(() => { if (active) setFailed(true); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [country, region, retry]);

  return <Box sx={{ gridColumn: "1 / -1", minWidth: 0 }}>
    {!editing ? <Box>
      <Typography variant="body2">Saved birthplace: {value}</Typography>
      <Button size="small" onClick={() => setEditing(true)}>Change birthplace</Button>
    </Box> : <>
      {value && !city && <Typography variant="caption" color="text.secondary">Saved birthplace: {value}. Select a city to replace it.</Typography>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1 }}>
        <Autocomplete size="small" options={countries} value={countries.find((item) => item.shortName === country) ?? null} getOptionLabel={(item) => item.name} isOptionEqualToValue={(a, b) => a.shortName === b.shortName}
          onChange={(_, item) => { setCountry(item?.shortName ?? ""); setRegion(""); setCity(""); setCities([]); if (city) onChange(""); }}
          renderInput={(params) => <TextField {...params} label="Birth country" />} />
        <Autocomplete size="small" options={states} value={region || null} disabled={!country || !states.length}
          onChange={(_, item) => { setRegion(item ?? ""); setCity(""); setCities([]); if (city) onChange(""); }}
          renderInput={(params) => <TextField {...params} label="Birth state or region" helperText={country && !states.length ? "No states or regions are listed for this country." : undefined} />} />
        <Autocomplete size="small" options={cities} filterOptions={filterCities} value={city || null} disabled={!region || loading || failed || !cities.length} loading={loading}
          onChange={(_, item) => { setCity(item ?? ""); onChange(item ? `${item}, ${region}, ${country}` : ""); }}
          noOptionsText="No cities listed"
          renderInput={(params) => <TextField {...params} label="Birth city" aria-busy={loading} error={!!error} helperText={error || (loading ? "Loading cities…" : region && !failed && !cities.length ? `No cities are listed for this region.${value ? " Your saved birthplace is kept." : ""}` : undefined)} />} />
      </Box>
      {failed && <Box><FormHelperText error role="alert">Cities could not be loaded.{value ? " Your saved birthplace is kept." : ""}</FormHelperText><Button size="small" onClick={() => setRetry((count) => count + 1)}>Retry cities</Button></Box>}
    </>}
    {!editing && error && <FormHelperText error>{error}</FormHelperText>}
  </Box>;
}
