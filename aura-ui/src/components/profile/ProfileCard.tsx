import { openProfileModal } from "@/store/slices/uiSlice";
import { Avatar, Button, Paper, Stack, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useAppSelector } from "@/store/hooks";

export default function ProfileCard() {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useDispatch();

  // 🔮 Use hardcoded fallback values for now

  const avatarUrl = "/avatars/avatar-1.png"; // optional: use emoji fallback instead

  if (!user) {
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
          alt={user.displayName}
          src={avatarUrl}
          sx={{ width: 80, height: 80 }}
        />
        <Typography variant="h6">{user.displayName}</Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ wordBreak: "break-word", px: 1 }}>
          {user.email}
        </Typography>
        <Typography variant="body2"> {user.zodiacSign}</Typography>
        <Button
          onClick={() => dispatch(openProfileModal())}
          size="small"
          variant="text"
          sx={{ textTransform: "none" }}>
          Edit Profile
        </Button>
      </Stack>
    </Paper>
  );
}
