import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MoodIcons } from "../../features/mood/models/aura/MoodIcons";
import type { MoodType } from "../../features/mood/models/schema/MoodType";
import type {
  MoodFrequencyResponse,
  MoodPercentResponse,
} from "../../features/mood/models/schema/MoodAuth";
import { Box, Typography } from "@mui/material";

const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#A569BD",
  "#4BC0C0",
  "#F7786B",
  "#5D6D7E",
  "#F4D03F",
  "#1ABC9C",
  "#E67E22",
];

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

export default function MoodPieChart({
  data,
}: {
  data: MoodFrequencyResponse[];
}) {
  const percentOnly = convertToPercentOnly(data);
  const grouped = groupSmallMoods(percentOnly);

  return (
    <Box mt={4}>
      <Typography align="center" variant="h5">
        Mood Breakdown
      </Typography>

      <Box width={400} height={400}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={grouped}
              dataKey="percent"
              nameKey="mood"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label={({ mood }) => `${MoodIcons[mood as MoodType] ?? "❔"}`}>
              {grouped.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontFamily: "Nunito, sans-serif",
                fontSize: 14,
              }}
              formatter={(value, name) => [
                `${value}%`,
                `${MoodIcons[name as MoodType] ?? "❔"} ${name}`,
              ]}
            />
            <Legend
              align="center"
              wrapperStyle={{
                fontFamily: "Nunito, sans-serif",
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
