// src/components/profile/AuraSelector.tsx
import React from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  useTheme,
} from "@mui/material";
import { Controller, type Control, type Path, useWatch } from "react-hook-form";
import { AuraColor } from "@/features/mood/models/aura";
import { auraPalettes, type AuraPaletteEntry } from "@/theme/auraTheme";
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
  const colorKey = useWatch({ control, name: colorField }) as AuraColor;
  const intensity = (useWatch({ control, name: intensityField }) ??
    500) as keyof AuraPaletteEntry;

  // pick the exact shade
  const shades = auraPalettes[colorKey];
  const previewColor = shades[intensity]?.main ?? shades.primary.main;
 const theme = useTheme();
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
        <FormControl fullWidth>
          <InputLabel id="aura-color-label">Aura Color</InputLabel>
          <Controller
            name={colorField}
            control={control}
            render={({ field }) => (
              <Select {...field} labelId="aura-color-label" label="Aura Color">
                {Object.values(AuraColor).map((c) => (
                  <MenuItem key={c} value={c}>
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        backgroundColor:
                          auraPalettes[c as AuraColor].primary.main,
                        borderRadius: "50%",
                        mr: 1,
                        verticalAlign: "middle",
                      }}
                    />
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </MenuItem>
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
              min={100}
              max={900}
              step={100}
              value={typeof field.value === "number" ? field.value : 500}
              onChange={(_, v) => field.onChange(v as number)}
              onBlur={field.onBlur}
              valueLabelDisplay="auto"
              sx={{
                "& .MuiSlider-thumb": { color: theme.palette.primary.main },
                "& .MuiSlider-track": { color: theme.palette.primary.main },
              }}
            />
          </Box>
        )}
      />
    </Box>
  );
};
