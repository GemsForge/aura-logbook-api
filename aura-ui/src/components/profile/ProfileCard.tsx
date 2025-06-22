import { Avatar,  Button, Paper, Typography, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

export default function ProfileCard() {
  const { userEmail, displayName, zodiacSign } = useSelector((state: RootState) => state.auth);

  // 🔮 Use hardcoded fallback values for now

  const avatarUrl = "/avatars/avatar-1.png"; // optional: use emoji fallback instead

  if (!displayName && !userEmail && !zodiacSign) {
    return <Typography>Loading profile...</Typography>;
  }
  
  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, sm: 3 },
        textAlign: "center",
        mx: "auto", // center on small screens
        maxWidth: 350,
      }}>
      <Stack spacing={2} alignItems="center">
        <Avatar
          alt={displayName}
          src={avatarUrl}
          sx={{ width: 80, height: 80 }}
        />
        <Typography variant="h6">{displayName}</Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ wordBreak: "break-word", px: 1 }}>
          {userEmail}
        </Typography>
        <Typography variant="body2"> {zodiacSign}</Typography>
        <Button
          disabled
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
