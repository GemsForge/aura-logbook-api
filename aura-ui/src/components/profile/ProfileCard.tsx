import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { useGetZodiacInsightQuery } from "@/store/auraApi";
import { useGetCurrentUserQuery } from "@/store/authApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { openProfileModal } from "@/store/slices/uiSlice";
import { getAuraColorPreview } from "@/theme/auraTheme";
import { getProfileCompletion } from "@/util/profile";
import {
  Avatar,
  Badge,
  Box,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import Sheet from "@mui/joy/Sheet";
import { AuraButton as Button } from "@/components/ui/AuraButton";
import { useEffect } from "react";
import { prismGarden } from "@/theme";



/** Shows account details and limits optional zodiac details to the Astrology & Energy pathway. */
export default function ProfileCard() {
  const dispatch = useAppDispatch();
  const { isFetching: userLoading } = useGetCurrentUserQuery();
  const user = useAppSelector(selectCurrentUser);
  const { data: referenceData } = useGetReferenceDataQuery();
  const showAstrologyContent = user?.selectedPathway === "energy";
  const pathway = referenceData?.pathways.find(({ key }) => key === user?.selectedPathway);
  const { data: zodiac, isLoading, refetch } = useGetZodiacInsightQuery(undefined, { skip: !showAstrologyContent });

  useEffect(() => {
    if (showAstrologyContent && user?.birthday) {
      refetch();
    }
  }, [showAstrologyContent, user?.birthday, refetch]);


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
  const bgColor = !isImage ? getAuraColorPreview(user.auraColor ?? "", user.auraIntensity, referenceData?.auras ?? []) : undefined;

  return (
    <Sheet
      variant="outlined"
      sx={{
        p: { xs: 1.75, sm: 2.5 },
        textAlign: "center",
        mx: "auto",
        maxWidth: 350,
        width: "100%",
        bgcolor: "var(--al-theme-surface)",
        borderColor: "divider",
        borderRadius: prismGarden.radius.card,
        boxShadow: prismGarden.shadow.soft,
      }}>
      <Stack spacing={2} alignItems="center">
        {/* Zodiac badge around avatar */}
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={
            showAstrologyContent && zodiac && !isLoading ? (
              <Typography fontSize={24} lineHeight={1}>
                {referenceData?.zodiacSigns.find((sign) => sign.key === zodiac.sign.toLowerCase())?.symbol || "?"}
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

          {user.selectedPathway && (
            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight={600}>
                My Pathway
              </Typography>
              {/* Pathway keys are stable API identifiers; display the current definition label. */}
              <Typography variant="body1">{pathway?.displayName ?? user.selectedPathway}</Typography>
              <Typography variant="body2" color="text.secondary">
                {pathway?.description}
              </Typography>
            </Box>
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
    </Sheet>
  );
}
