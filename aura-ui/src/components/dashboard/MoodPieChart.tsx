import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import type { MoodType } from "../../features/mood/models/schema/MoodType";
import type {
  MoodFrequencyResponse,
  MoodPercentResponse,
} from "../../features/mood/models/schema/MoodAuth";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { prismGarden } from "@/theme";

// ✅ Converts incoming backend data to percent-only structure
function convertToPercentOnly(
  data: MoodFrequencyResponse[]
): MoodPercentResponse[] {
  return data
    .filter(
      (entry): entry is { mood: MoodType; percent: number } =>
        "percent" in entry
    )
    .map((entry) => ({
      mood: entry.mood,
      percent: entry.percent,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);
}

// ✅ Groups small slices into "Other"
function groupSmallMoods(data: MoodPercentResponse[]): MoodPercentResponse[] {
  return data.reduce((acc, mood) => {
    if (mood.percent < 5) {
      const other = acc.find((m) => m.mood === "Other");
      if (other) {
        other.percent += mood.percent;
      } else {
        acc.push({ mood: "Other", percent: mood.percent });
      }
    } else {
      acc.push(mood);
    }
    return acc;
  }, [] as MoodPercentResponse[]);
}

/**
 * Displays the five most frequent moods as a percentage breakdown.
 *
 * The chart owns no fixed width: `ResponsiveContainer` follows its grid cell
 * and the plot height steps down on narrow screens. This prevents dashboard
 * content from forcing horizontal page scrolling at the 320px reflow anchor.
 */
export default function MoodPieChart({
  data,
}: {
  data: MoodFrequencyResponse[];
}) {
  const { data: referenceData } = useGetReferenceDataQuery();
  const percentOnly = convertToPercentOnly(data);
  const grouped = groupSmallMoods(percentOnly);
  const colorForMood = (mood: string) => {
    if (!referenceData) return "currentColor";
    const moodDefinition = referenceData.moods.find((definition) => definition.key === mood);
    return referenceData.auras.find((aura) => aura.key === moodDefinition?.auraColorKeys[0])?.baseHex ??
      referenceData.auras[0]?.baseHex ?? "currentColor";
  };

  return (
    <Box mt={4}>
      <Typography level="title-lg" textAlign="center">
        Mood Breakdown
      </Typography>

      <Box sx={{ width: "100%", minWidth: 0, height: { xs: 320, sm: 400 } }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={grouped}
              dataKey="percent"
              nameKey="mood"
              cx="50%"
              cy="50%"
              outerRadius="68%"
              label={({ cx, cy, midAngle, outerRadius, mood }) => {
                const icon = referenceData?.moods.find((definition) => definition.key === mood)?.icon;
                if (!icon || typeof cx !== "number" || typeof cy !== "number" || typeof midAngle !== "number" || typeof outerRadius !== "number") return null;
                const angle = (-midAngle * Math.PI) / 180;
                const radius = outerRadius * 1.12;
                const x = cx + radius * Math.cos(angle) - 10;
                const y = cy + radius * Math.sin(angle) - 10;
                return <image href={icon} x={x} y={y} width={20} height={20} aria-hidden="true" />;
              }}>
              {grouped.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colorForMood(entry.mood)}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontFamily: prismGarden.font.body,
                fontSize: 14,
              }}
              formatter={(value, name) => [
                `${value}%`,
                String(name),
              ]}
            />
            <Legend
              align="center"
              wrapperStyle={{
                fontFamily: prismGarden.font.body,
                fontSize: 13,
                fontWeight: 500,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
