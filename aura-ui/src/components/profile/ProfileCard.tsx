import { AuraColor } from "@/features/mood/models/aura";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { openProfileModal } from "@/store/slices/uiSlice";
import { auraPalettes } from "@/theme/auraTheme";
import { Avatar, Button, Paper, Stack, Typography } from "@mui/material";

export default function ProfileCard() {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();

  // 🔮 Use hardcoded fallback values for now
  if (!user) {
    console.debug("USER", user);

    return <Typography>Loading profile...</Typography>;
  }
  
  const key: AuraColor = user.auraColor ?? AuraColor.Blue;
  const avatarVal = user.avatar || "";
  const isImage = avatarVal.startsWith("/") || avatarVal.startsWith("http");
  // background only when initials
  const bgColor = !isImage ? auraPalettes[key].primary.main : undefined;

  
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
          // only feed src when it's really an image
          src={isImage ? avatarVal : undefined}
          sx={{
            width: 80,
            height: 80,
            bgcolor: bgColor,
            whiteSpace: "nowrap",
          }}>
          {/* only render children when NOT an image */}
          {!isImage ? avatarVal : null}
        </Avatar>

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
