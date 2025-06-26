import type { EditProfileFormData } from "@/features/auth/models/EditProfileSchema";
import { DEFAULT_MOTTOS } from "@/features/profile/DEFAULT_MOTTOS";
import { Autocomplete, TextField } from "@mui/material";
import { type Control, Controller } from "react-hook-form";

interface MottoFieldProps {
  control: Control<EditProfileFormData>;
  name:"motto";
}

export const MottoField: React.FC<MottoFieldProps> = ({ control, name }) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => (
      <Autocomplete
        freeSolo
        options={DEFAULT_MOTTOS}
        inputValue={field.value ?? ""}
        onInputChange={(_, newValue) => field.onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Motto (optional)"
            placeholder="Choose or write your own"
            fullWidth
            margin="normal"
          />
        )}
      />
    )}
  />
);
