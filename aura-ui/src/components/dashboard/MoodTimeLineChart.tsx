import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Box, Typography } from "@mui/material";

export type MoodByDate = {
  date: string;
  count: number;
};

export default function MoodTimelineChart({ data }: { data: MoodByDate[] }) {
  return (
    <Box mt={4}>
      <Typography variant="h5">Mood Entry Timeline</Typography>

      <Box height={400} width={400}>
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
