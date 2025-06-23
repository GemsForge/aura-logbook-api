import { Box, Container, Grid } from "@mui/material";
import { Footer, NavBar, Sidebar } from ".";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import ProfileCard from "../profile/ProfileCard";
import EditProfileModal from "../profile/EditProfileModal";

const AppLayout = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <NavBar />

        <Container sx={{ mt: 4, flexGrow: 1 }}>
          {isAuthenticated ? (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 3 }}>
                <ProfileCard />
              </Grid>
              <Grid size={{ xs: 12, md: 9 }}>
                <Outlet />
                <EditProfileModal/>
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
