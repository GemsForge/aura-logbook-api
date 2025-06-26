import { AuraColor } from "@/features/mood/models/aura";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { openProfileModal } from "@/store/slices/uiSlice";
import { auraPalettes } from "@/theme/auraTheme";
import { getProfileCompletion } from "@/util/profile";
import {
  Avatar,
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export default function ProfileCard() {
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();

  // 🔮 Use hardcoded fallback values for now
  if (!user) {
    console.debug("USER", user);

    return <Typography>Loading profile...</Typography>;
  }
  const completion = getProfileCompletion(user);

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
        
        <Box p={2}>
          {/* avatar, name… */}
          {user.motto && (
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "text.secondary", mt: 1 }}>
              “{user.motto}”
            </Typography>
          )}

          {/* …progress bar / complete message… */}
          {completion < 100 ? (
            <>
              <Typography variant="caption" sx={{ mt: 1 }}>
                Profile Complete: {completion}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={completion}
                sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
              />
            </>
          ) : (
            <Typography
              variant="subtitle2"
              sx={{ mt: 1, color: "success.main", fontWeight: 500 }}>
              🎉 Profile Complete!
            </Typography>
          )}

          <Button
            onClick={() => dispatch(openProfileModal())}
            size="small"
            variant="text"
            sx={{ textTransform: "none" }}>
            Edit Profile
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
