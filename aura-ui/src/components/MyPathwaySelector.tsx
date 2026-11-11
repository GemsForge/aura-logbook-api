import {
  SpiritualPathway,
  SpiritualPathwayDescriptions,
} from "@/features/auth/models";
import Box from "@mui/joy/Box";
import FormHelperText from "@mui/joy/FormHelperText";
import Radio from "@mui/joy/Radio";
import RadioGroup from "@mui/joy/RadioGroup";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
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
  [SpiritualPathway.Faith]: "Faith & Religion",
};

/** Provides compact, keyboard-accessible pathway choices and the selected description. */
export function MyPathwaySelector<TForm extends FieldValues & PathwayField>({
  control,
  name,
  errorMessage,
}: MyPathwaySelectorProps<TForm>) {
  return (
    <Controller
      name={(name ?? ("spiritualPathway" as Path<TForm>)) as Path<TForm>}
      control={control}
      render={({ field }) => (
        <Box>
          <Typography level="title-sm" id="pathway-label" sx={{ mb: 0.75 }}>
            My pathway
          </Typography>

          {/* Radio values are always strings in the DOM. We compare via String()
              so this works whether SpiritualPathway is a string or numeric enum. */}
          <RadioGroup
            orientation="horizontal"
            aria-labelledby="pathway-label"
            value={String(field.value)}
            onChange={(e) => {
              const next = PATHWAY_ORDER.find(
                (p) => String(p) === e.target.value,
              );
              if (next !== undefined) field.onChange(next);
            }}
            sx={{ gap: 1, flexWrap: "wrap" }}>
            {PATHWAY_ORDER.map((pathway) => (
              <Sheet
                key={pathway}
                variant="outlined"
                sx={{ borderRadius: "md", px: 1.5, py: 1, flex: "1 1 9rem" }}>
                <Radio
                  overlay
                  disableIcon
                  value={String(pathway)}
                  label={PATHWAY_TITLES[pathway]}
                  slotProps={{
                    // Highlight the chosen chip with a thicker primary border
                    action: ({ checked }) => ({
                      sx: (theme) => ({
                        ...(checked && {
                          "--variant-borderWidth": "2px",
                          "&&": {
                            borderColor: theme.vars.palette.primary[400],
                          },
                        }),
                      }),
                    }),
                  }}
                />
              </Sheet>
            ))}
          </RadioGroup>

          {/* One caption that follows the selection, replacing three permanent descriptions */}
          <Typography level="body-xs" sx={{ mt: 0.75 }}>
            {SpiritualPathwayDescriptions[field.value as SpiritualPathway]}
          </Typography>

          {errorMessage && (
            <FormHelperText sx={{ mt: 0.5, color: "danger.plainColor" }}>
              {errorMessage}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
}
