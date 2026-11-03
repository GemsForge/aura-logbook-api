import Box from "@mui/joy/Box";
import Container from "@mui/joy/Container";
import Link from "@mui/joy/Link";
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
    <Box className="prism-page" sx={{ display: "flex", minHeight: "100vh" }}>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Link href="#main-content" sx={{ position: "absolute", left: -10000, "&:focus": { left: 16, top: 16, zIndex: 10 } }}>
          Skip to main content
        </Link>
        <NavBar />

        <Container component="main" id="main-content" maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: 3, flexGrow: 1, px: { xs: 2, md: 4 } }}>
          {isAuthenticated ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" },
                gap: { xs: 2, md: 5 },
              }}
            >
              <Box sx={{ gridColumn: { xs: "1", md: "2" }, gridRow: "1", minWidth: 0 }}>
                <Outlet />
                <EditProfileModal
                  onClose={() => dispatch(closeProfileModal())}
                  open={isProfileModalOpen}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: "1", md: "1" }, gridRow: { xs: "2", md: "1" } }}>
                <ProfileCard />
                <Sidebar />
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
