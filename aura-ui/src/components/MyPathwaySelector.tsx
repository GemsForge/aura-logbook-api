import { Box, FormHelperText, Switch, Typography } from "@mui/material";
import Sheet from "@mui/joy/Sheet";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";

type PathwayField = { spiritualPathway: string };

interface MyPathwaySelectorProps<TForm extends FieldValues & PathwayField> {
  control: Control<TForm>;
  name?: Path<TForm>;
  errorMessage?: string;
}

/** Renders pathway choices and copy from the active reference-data response. */
export function MyPathwaySelector<TForm extends FieldValues & PathwayField>({
  control,
  name,
  errorMessage,
}: MyPathwaySelectorProps<TForm>) {
  const { data, isError } = useGetReferenceDataQuery();
  const pathways = data?.pathways ?? [];

  return (
    <Sheet variant="outlined" sx={{ mt: 2, p: 2 }}>
      <Typography variant="h6">My Pathway</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Choose the primary journey that guides your reflections.
      </Typography>
      {!data || isError ? (
        <FormHelperText error role="alert">Pathway choices are unavailable. Reload to try again.</FormHelperText>
      ) : (
        <Controller
          name={(name ?? ("spiritualPathway" as Path<TForm>)) as Path<TForm>}
          control={control}
          render={({ field }) => (
            <>
              {pathways.map((pathway, index) => (
                <Box key={pathway.key} display="flex" alignItems="center" py={1} gap={2}
                  borderBottom={index === pathways.length - 1 ? "none" : "1px solid"} borderColor="divider">
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1">{pathway.displayName}</Typography>
                    <Typography variant="body2" color="text.secondary">{pathway.description}</Typography>
                  </Box>
                  <Switch checked={field.value === pathway.key} onChange={() => field.onChange(pathway.key)}
                    slotProps={{ input: { "aria-label": `Select ${pathway.displayName}` } }} />
                </Box>
              ))}
              {errorMessage && <FormHelperText error sx={{ mt: 1 }}>{errorMessage}</FormHelperText>}
            </>
          )}
        />
      )}
    </Sheet>
  );
}
