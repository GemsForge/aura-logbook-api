import {
  SpiritualPathway,
  SpiritualPathwayDescriptions,
} from "@/features/auth/models";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormHelperText,
  Switch,
  Typography,
} from "@mui/material";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

type PathwayField = {
  spiritualPathway: SpiritualPathway;
};

interface MyPathwaySelectorProps<TForm extends FieldValues & PathwayField> {
  control: Control<TForm>;
  name?: Path<TForm>;
  errorMessage?: string;
}

const PATHWAY_ORDER: SpiritualPathway[] = [
  SpiritualPathway.Mindfulness,
  SpiritualPathway.Energy,
  SpiritualPathway.Faith,
];

const PATHWAY_TITLES: Record<string, string> = {
  [SpiritualPathway.Mindfulness]: "Mindfulness",
  [SpiritualPathway.Energy]: "Astrology & Energy",
  [SpiritualPathway.Faith]: "Christian Faith",
};

export function MyPathwaySelector<TForm extends FieldValues & PathwayField>({
  control,
  name,
  errorMessage,
}: MyPathwaySelectorProps<TForm>) {
  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardHeader
        title="My Pathway"
        subheader="Choose the primary journey that guides your reflections."
        sx={{ pb: 0 }}
      />
      <CardContent>
        <Controller
          name={(name ?? ("spiritualPathway" as Path<TForm>)) as Path<TForm>}
          control={control}
          render={({ field }) => (
            <>
              {PATHWAY_ORDER.map((pathway, index) => {
                const isSelected = field.value === pathway;
                return (
                  <Box
                    key={pathway}
                    display="flex"
                    alignItems="center"
                    py={1}
                    gap={2}
                    borderBottom={
                      index === PATHWAY_ORDER.length - 1 ? "none" : "1px solid"
                    }
                    borderColor="divider">
                    <Box flexGrow={1}>
                      <Typography variant="subtitle1">
                        {PATHWAY_TITLES[pathway]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {SpiritualPathwayDescriptions[pathway]}
                      </Typography>
                    </Box>
                    <Switch
                      checked={isSelected}
                      onChange={() => field.onChange(pathway)}
                      slotProps={{
                        input: {
                          "aria-label": `Select ${PATHWAY_TITLES[pathway]}`,
                        },
                      }}
                    />
                  </Box>
                );
              })}
              {errorMessage && (
                <FormHelperText error sx={{ mt: 1 }}>
                  {errorMessage}
                </FormHelperText>
              )}
            </>
          )}
        />
      </CardContent>
    </Card>
  );
}
