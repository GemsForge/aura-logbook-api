import { Avatar,  Button, Paper, Typography, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";


export default function ProfileCard() {
  const { userEmail, displayName } = useSelector((state: RootState) => state.auth);

  // 🔮 Use hardcoded fallback values for now
  const zodiacSign = "♌ Leo";
  const streak = 5;
  const avatarUrl = "/avatars/avatar-1.png"; // optional: use emoji fallback instead

  return (
    <Paper elevation={2} sx={{ padding: 3, textAlign: "center" }}>
      <Stack spacing={2} alignItems="center">
        <Avatar
          alt={displayName}
          src={avatarUrl}
          sx={{ width: 80, height: 80 }}
        />
        <Typography variant="h6">{displayName}</Typography>
        <Typography variant="body2" color="textSecondary">
          {userEmail}
        </Typography>
        <Typography variant="body2">🔮 {zodiacSign}</Typography>
        <Typography variant="body2">🔥 {streak}-day streak</Typography>
        <Button
          size="small"
          variant="text"
          href="/profile"
          sx={{ textTransform: "none" }}>
          Edit Profile
        </Button>
      </Stack>
    </Paper>
  );
}
