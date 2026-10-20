import Box from "@mui/joy/Box";
import Container from "@mui/joy/Container";
import { Footer, NavBar, Sidebar } from ".";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import ProfileCard from "../profile/ProfileCard";
import EditProfileModal from "../profile/EditProfileModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  closeProfileModal,
  selectIsProfileModalOpen,
} from "@/store/slices/uiSlice";

/**
 * Root page shell shared by public and authenticated routes.
 *
 * Authenticated pages use semantic grid areas so DOM reading order remains
 * navigation → primary content → profile. CSS repositions the profile beside
 * the content on larger screens while preserving that mobile and assistive-
 * technology order. The skip link targets the focusable `main` landmark.
 */
const AppLayout = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const isProfileModalOpen = useAppSelector(selectIsProfileModalOpen);

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        minWidth: 0,
        bgcolor: "background.body",
      }}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}>
        <NavBar />

        <Container
          component="main"
          id="main-content"
          maxWidth={false}
          tabIndex={-1}
          sx={{
            width: "min(100%, 1440px)",
            mx: "auto",
            py: { xs: 2, sm: 3, lg: 4 },
            px: { xs: 2, sm: 3, lg: 5 },
            flexGrow: 1,
          }}>
          {isAuthenticated ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  md: "17rem minmax(0, 1fr)",
                },
                gridTemplateAreas: {
                  xs: '"navigation" "content" "profile"',
                  md: '"navigation content" "profile content"',
                },
                alignItems: "start",
                gap: { xs: 2, md: 3, lg: 4 },
              }}>
              <Box
                component="aside"
                aria-label="Journal destinations"
                sx={{ gridArea: "navigation", minWidth: 0 }}>
                <Sidebar />
              </Box>
              <Box
                sx={{
                  gridArea: "content",
                  minWidth: 0,
                  p: { xs: 0, lg: 0.5 },
                  "& > :first-of-type": { mt: 0 },
                }}>
                <Outlet />
                <EditProfileModal
                  onClose={() => dispatch(closeProfileModal())}
                  open={isProfileModalOpen}
                />
              </Box>
              <Box
                sx={{
                  gridArea: "profile",
                  minWidth: 0,
                  mt: { xs: 1, md: 0 },
                }}>
                <ProfileCard />
              </Box>
            </Box>
          ) : (
            <Box sx={{ width: "min(100%, 72rem)", mx: "auto", minWidth: 0 }}>
              <Outlet />
            </Box>
          )}
        </Container>

        <Footer />
      </Box>
    </Box>
  );
};

export default AppLayout;
