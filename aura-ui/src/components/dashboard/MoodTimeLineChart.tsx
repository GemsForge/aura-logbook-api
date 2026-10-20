import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";

export type MoodByDate = {
  date: string;
  count: number;
};

/**
 * Plots mood-entry counts over time within the width of its parent grid cell.
 * A responsive container is required here because a fixed chart width breaks
 * mobile reflow and 200% zoom layouts.
 */
export default function MoodTimelineChart({ data }: { data: MoodByDate[] }) {
  return (
    <Box mt={4}>
      <Typography level="title-lg">Mood Entry Timeline</Typography>

      <Box sx={{ width: "100%", minWidth: 0, height: { xs: 320, sm: 400 } }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{
                fontFamily: "Nunito, sans-serif",
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
