import { AuraColor } from "@/features/mood/models/aura";
import { zodiacEmojis } from "@/features/zodiac/models/ZodiacEmojis";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { useGetCurrentUserQuery } from "@/store/authApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { openProfileModal } from "@/store/slices/uiSlice";
import { auraPalettes } from "@/theme/auraTheme";
import { getProfileCompletion } from "@/util/profile";
import {
  Avatar,
  Badge,
  Box,
  Button,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect } from "react";



export default function ProfileCard() {
  const dispatch = useAppDispatch();
  const { isFetching: userLoading } = useGetCurrentUserQuery();
  const user = useAppSelector(selectCurrentUser);
  const { data: zodiac, isLoading, refetch } = useGetZodiacInsightQuery();

  useEffect(() => {
    if (user?.birthday) {
      refetch();
    }
  }, [user?.birthday, refetch]);


  if (userLoading || !user) {
    return (
      <Box
        p={2}
        display="flex"
        flexDirection="column"
        gap={1}
        alignItems="center">
        {/* Circular avatar placeholder */}
        <Skeleton variant="circular" width={80} height={80} />
        {/* Name placeholder */}
        <Skeleton variant="text" width={120} height={32} />
        {/* Bio or details placeholder */}
        <Skeleton variant="rectangular" width="80%" height={24} />
        {/* Larger section (e.g. stats/card) */}
        <Skeleton variant="rectangular" width="80%" height={150} />
      </Box>
    );
  }

  const completion = getProfileCompletion(user);

  // Determine user avatar
  const avatarVal = user.avatar ?? "";
  const isImage = avatarVal.startsWith("/") || avatarVal.startsWith("http");
  const auraKey: AuraColor = user.auraColor ?? AuraColor.Blue;
  const bgColor = !isImage ? auraPalettes[auraKey].primary.main : undefined;

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, sm: 3 },
        textAlign: "center",
        mx: "auto",
        maxWidth: 350,
      }}>
      <Stack spacing={2} alignItems="center">
        {/* Zodiac badge around avatar */}
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={
            zodiac && !isLoading ? (
              <Typography fontSize={24} lineHeight={1}>
                {zodiacEmojis[zodiac.sign.toLowerCase()] || "?"}
              </Typography>
            ) : null
          }
        >
          <Avatar
            alt={user.displayName}
            src={isImage ? avatarVal : undefined}
            sx={{
              width: 80,
              height: 80,
              bgcolor: bgColor,
              whiteSpace: "nowrap",
            }}>
            {!isImage && avatarVal}
          </Avatar>
        </Badge>

        <Typography variant="h6">{user.displayName}</Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ wordBreak: "break-word", px: 1 }}>
          {user.email}
        </Typography>

        {/* Remove zodiacSign text display */}

        <Box p={2}>
          {user.motto && (
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "text.secondary", mt: 1 }}>
              “{user.motto}”
            </Typography>
          )}

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
