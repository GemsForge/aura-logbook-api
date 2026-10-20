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
import { Controller, type Control, type Path, useWatch } from "react-hook-form";
import { AuraColor } from "@/features/mood/models/aura";
import { useGetAuraColorsQuery } from "@/store/referenceDataApi";
import { auraPalettes, getAuraColorPreview } from "@/theme/auraTheme";
import type { EditProfileFormData } from "@/features/auth/models/EditProfileSchema";

interface AuraSelectorProps {
  control: Control<EditProfileFormData>;
  colorField: Path<EditProfileFormData>;
  intensityField: Path<EditProfileFormData>;
}

export const AuraSelector: React.FC<AuraSelectorProps> = ({
  control,
  colorField,
  intensityField,
}) => {
  // watch the two fields
  const colorKey = useWatch({ control, name: colorField });
  const intensity = useWatch({ control, name: intensityField });
  const previewColor = getAuraColorPreview(colorKey, intensity);
  const { data: auraDefinitions = [] } = useGetAuraColorsQuery();
  const supportedColors = new Set<string>(Object.values(AuraColor));
  const databaseOptions = auraDefinitions.filter((definition) =>
    supportedColors.has(definition.key)
  );
  const colorOptions = databaseOptions.length > 0
    ? databaseOptions
    : Object.values(AuraColor).map((key) => ({
        key,
        displayName: key.charAt(0).toUpperCase() + key.slice(1),
        baseHex: auraPalettes[key].primary.main ?? "#2196f3",
      }));
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                  listbox: { sx: { zIndex: 1500 } },
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
