import { Box, Container, Grid } from "@mui/material";
import { Footer, NavBar, Sidebar } from ".";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import ProfileCard from "../profile/ProfileCard";
import EditProfileModal from "../profile/EditProfileModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeProfileModal, selectIsProfileModalOpen } from "@/store/slices/uiSlice";

const AppLayout = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const isProfileModalOpen = useAppSelector(selectIsProfileModalOpen);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <NavBar />

        <Container sx={{ mt: 4, flexGrow: 1 }}>
          {isAuthenticated ? (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 3 }}>
                <ProfileCard />
                <Sidebar />
              </Grid>
              <Grid size={{ xs: 12, md: 9 }}>
                <Outlet />
                <EditProfileModal
                  onClose={() => dispatch(closeProfileModal())}
                  open={isProfileModalOpen}
                />
              </Grid>
            </Grid>
          ) : (
            <Outlet />
          )}
        </Container>

        <Footer />
      </Box>
    </Box>
  );
};

export default AppLayout;
