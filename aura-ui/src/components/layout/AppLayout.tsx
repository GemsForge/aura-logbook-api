import Box from "@mui/joy/Box";
import Container from "@mui/joy/Container";
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
    <Box sx={{ display: "flex", minHeight: "100vh", minWidth: 0 }}>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <NavBar />

        <Container sx={{ mt: 4, flexGrow: 1 }}>
          {isAuthenticated ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
                gap: 4,
              }}
            >
              <Box sx={{ gridColumn: { xs: "span 1", md: "span 3" } }}>
                <ProfileCard />
                <Sidebar />
              </Box>
              <Box sx={{ gridColumn: { xs: "span 1", md: "span 9" }, minWidth: 0 }}>
                <Outlet />
                <EditProfileModal
                  onClose={() => dispatch(closeProfileModal())}
                  open={isProfileModalOpen}
                />
              </Box>
            </Box>
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
