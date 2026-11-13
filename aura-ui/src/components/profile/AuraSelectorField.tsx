// src/components/profile/AuraSelector.tsx
import React from "react";
import {
  Box,
  Typography,
  Slider,
} from "@mui/material";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import { Controller, type Control, type FieldPathByValue, useWatch } from "react-hook-form";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { getAuraColorPreview } from "@/theme/auraTheme";
import type { EditProfileFormData } from "@/features/auth/models/EditProfileSchema";

interface AuraSelectorProps {
  control: Control<EditProfileFormData>;
  colorField: FieldPathByValue<EditProfileFormData, string | undefined>;
  intensityField: FieldPathByValue<EditProfileFormData, number | undefined>;
}

export const AuraSelector: React.FC<AuraSelectorProps> = ({
  control,
  colorField,
  intensityField,
}) => {
  // watch the two fields
  const colorKey = useWatch({ control, name: colorField });
  const intensity = useWatch({ control, name: intensityField });
  const { data } = useGetReferenceDataQuery();
  const colorOptions = data?.auras ?? [];
  const previewColor = getAuraColorPreview(colorKey, intensity, colorOptions);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {!data ? <Typography role="alert" color="error">Aura colors are unavailable.</Typography> : null}
      {/* Color picker + swatch */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            bgcolor: previewColor,
            border: "1px solid",
            borderColor: "grey.400",
          }}
        />
        <FormControl sx={{ width: "100%" }}>
          <FormLabel id="aura-color-label">Aura Color</FormLabel>
          <Controller
            name={colorField}
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                value={field.value}
                onChange={(_, value) => {
                  if (value !== null) field.onChange(value);
                }}
                onBlur={field.onBlur}
                slotProps={{
                  button: { "aria-labelledby": "aura-color-label" },
                  // Keep the options inside the Material dialog's focus trap.
                  listbox: { disablePortal: true, sx: { zIndex: 1500 } },
                }}>
                {colorOptions.map((color) => (
                  <Option key={color.key} value={color.key}>
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        backgroundColor: color.baseHex,
                        borderRadius: "50%",
                        mr: 1,
                        verticalAlign: "middle",
                      }}
                    />
                    {color.displayName}
                  </Option>
                ))}
              </Select>
            )}
          />
        </FormControl>
      </Box>

      {/* Intensity slider */}
      <Controller
        name={intensityField}
        control={control}
        render={({ field }) => (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography gutterBottom>Intensity ({field.value})</Typography>
            <Slider
              aria-label="Aura intensity"
              min={0}
              max={100}
              step={10}
              value={typeof field.value === "number" ? field.value : 50}
              onChange={(_, v) => field.onChange(v as number)}
              onBlur={field.onBlur}
              valueLabelDisplay="auto"
              sx={{
                "& .MuiSlider-thumb": { color: previewColor },
                "& .MuiSlider-track": { color: previewColor },
              }}
            />
          </Box>
        )}
      />
    </Box>
  );
};
