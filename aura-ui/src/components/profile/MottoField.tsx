import type { EditProfileFormData } from "@/features/auth/models/EditProfileSchema";
import { DEFAULT_MOTTOS } from "@/features/profile/DEFAULT_MOTTOS";
import Autocomplete from "@mui/joy/Autocomplete";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
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
      <FormControl sx={{ my: 1 }}>
        <FormLabel>Motto (optional)</FormLabel>
        <Autocomplete
          freeSolo
          options={DEFAULT_MOTTOS}
          inputValue={field.value ?? ""}
          onInputChange={(_, newValue) => field.onChange(newValue)}
          slotProps={{ input: { placeholder: "Choose or write your own" } }}
        />
      </FormControl>
    )}
  />
);
