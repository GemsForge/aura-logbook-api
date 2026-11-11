import { useState } from "react";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { Controller, type Control, type FieldErrors, type UseFormSetValue, useWatch } from "react-hook-form";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { AuraInput as TextField } from "@/components/ui/AuraInput";
import type { EditProfileFormData } from "@/features/auth/models/EditProfileSchema";
import {
  deviceLocationFailureCopy,
  readDeviceLocation,
  type WeatherLocationMode,
} from "@/features/weather/weatherLocation";

interface WeatherLocationFieldProps {
  control: Control<EditProfileFormData>;
  setValue: UseFormSetValue<EditProfileFormData>;
  errors: FieldErrors<EditProfileFormData>;
}

/**
 * Profile setting for where Today's weather comes from (#331). Off is the default. Device
 * location asks the browser for permission only when the user presses the button here, never
 * on page load; failures explain what happened and offer typing a city instead.
 */
export function WeatherLocationField({ control, setValue, errors }: WeatherLocationFieldProps) {
  const mode = useWatch({ control, name: "weatherLocationMode" });
  const [deviceStatus, setDeviceStatus] = useState<"idle" | "asking" | "failed">("idle");
  const [deviceMessage, setDeviceMessage] = useState("");

  const chooseMode = (next: WeatherLocationMode) => {
    setDeviceStatus("idle");
    setDeviceMessage("");
    // Device mode is set only after the browser grants permission (see turnOnDeviceLocation below).
    if (next !== "Device") setValue("weatherLocationMode", next, { shouldDirty: true, shouldValidate: true });
    else void turnOnDeviceLocation();
  };

  const turnOnDeviceLocation = async () => {
    setDeviceStatus("asking");
    const result = await readDeviceLocation();
    if (result.ok) {
      // The coordinates are discarded: only the choice is saved, and Today reads a fresh,
      // rounded position each time.
      setValue("weatherLocationMode", "Device", { shouldDirty: true, shouldValidate: true });
      setDeviceStatus("idle");
      setDeviceMessage("This device’s location will be used for weather, rounded to your area.");
    } else {
      setDeviceStatus("failed");
      setDeviceMessage(deviceLocationFailureCopy[result.reason]);
    }
  };

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend" id="weather-location-label">Weather location</FormLabel>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
        Used only for the weather on Today. Off unless you choose a place.
      </Typography>
      <RadioGroup
        aria-labelledby="weather-location-label"
        name="weatherLocationMode"
        value={deviceStatus === "asking" ? "Device" : mode}
        onChange={(event) => chooseMode(event.target.value as WeatherLocationMode)}
        sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, columnGap: 2 }}>
        <FormControlLabel value="Off" control={<Radio size="small" />} label="Off" />
        <FormControlLabel value="City" control={<Radio size="small" />} label="A city I type" />
        <FormControlLabel value="Device" control={<Radio size="small" />} label="This device’s location" />
      </RadioGroup>

      {deviceStatus === "asking" && <Typography role="status" variant="body2" sx={{ mt: 0.5 }}>Asking your browser for permission…</Typography>}
      {deviceMessage && (
        <Box role={deviceStatus === "failed" ? "alert" : "status"} sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: deviceStatus === "failed" ? "error.main" : "text.secondary" }}>{deviceMessage}</Typography>
          {deviceStatus === "failed" && (
            <Button variant="outlined" size="small" onClick={() => chooseMode("City")}>Type a city instead</Button>
          )}
        </Box>
      )}

      {mode === "City" && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1.4fr 1fr" }, gap: 1, mt: 1 }}>
          <Controller name="weatherCity" control={control} render={({ field }) => (
            <TextField {...field} value={field.value ?? ""} label="City" size="sm" autoComplete="address-level2"
              error={!!errors.weatherCity} helperText={errors.weatherCity?.message} />
          )} />
          <Controller name="weatherRegion" control={control} render={({ field }) => (
            <TextField {...field} value={field.value ?? ""} label="State or region (optional)" size="sm" autoComplete="address-level1"
              error={!!errors.weatherRegion} helperText={errors.weatherRegion?.message} />
          )} />
          <Controller name="weatherCountry" control={control} render={({ field }) => (
            <TextField {...field} value={field.value ?? ""} label="Country code" placeholder="US" size="sm" autoComplete="country"
              slotProps={{ input: { maxLength: 2 } }} error={!!errors.weatherCountry} helperText={errors.weatherCountry?.message} />
          )} />
        </Box>
      )}

      <Controller name="temperatureUnit" control={control} render={({ field }) => (
        <RadioGroup row aria-label="Temperature unit" name="temperatureUnit" value={field.value} onChange={(event) => field.onChange(event.target.value)} sx={{ mt: 0.5 }}>
          <FormControlLabel value="F" control={<Radio size="small" />} label="°F" />
          <FormControlLabel value="C" control={<Radio size="small" />} label="°C" />
        </RadioGroup>
      )} />
    </FormControl>
  );
}
