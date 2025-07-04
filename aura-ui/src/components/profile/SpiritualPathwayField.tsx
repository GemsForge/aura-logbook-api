import {
    SpiritualPathway,
    SpiritualPathwayDescriptions,
} from "@/features/auth/models";
import {
    Autocomplete,
    Box,
    Checkbox,
    TextField,
    Typography,
} from "@mui/material";
import { Controller, type Control } from "react-hook-form";

interface SpiritualPathwayFieldProps {
  control: Control<any>;
  error?: boolean;
  helperText?: string;
}

export const SpiritualPathwayField = ({
  control,
  error,
  helperText,
}: SpiritualPathwayFieldProps) => (
  <Box sx={{ mt: 2, mb: 1 }}>
    <Controller
      name="spiritualPathways"
      control={control}
      render={({ field }) => (
        <Autocomplete
          multiple
          options={Object.values(SpiritualPathway)}
          disableCloseOnSelect
          value={field.value ?? []}
          onChange={(_, newValue) => field.onChange(newValue)}
          getOptionLabel={(option) => option}
          renderOption={(props, option: SpiritualPathway, { selected }) => (
            <li {...props}>
              <Checkbox checked={selected} sx={{ mr: 1 }} />
              <Box>
                <Typography component="span" fontWeight="bold">
                  {option}
                </Typography>
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}>
                  {SpiritualPathwayDescriptions[option]}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Spiritual Pathways"
              error={error}
              helperText={helperText}
              placeholder="Select one or more"
            />
          )}
          sx={{ minWidth: 220 }}
        />
      )}
    />
    <Typography variant="caption" color="text.secondary" mt={0.5}>
      You can select more than one pathway if you like!
    </Typography>
  </Box>
);
