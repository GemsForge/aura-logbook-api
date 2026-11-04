import Box from "@mui/joy/Box";
import Container from "@mui/joy/Container";
import Link from "@mui/joy/Link";
import { Footer, NavBar, Sidebar } from ".";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import EditProfileModal from "../profile/EditProfileModal";
import MobileNavigation from "./MobileNavigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { closeProfileModal, selectIsProfileModalOpen } from "@/store/slices/uiSlice";

/** Shares the aura atmosphere and responsive shell while keeping page content shrinkable. */
const AppLayout = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const isProfileModalOpen = useAppSelector(selectIsProfileModalOpen);

  return (
    <Box className="prism-page" sx={{ display: "flex", minHeight: "100vh", pb: isAuthenticated ? { xs: "calc(96px + env(safe-area-inset-bottom, 0px))", md: 0 } : 0 }}>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Link href="#main-content" sx={{ position: "absolute", left: -10000, "&:focus": { left: 16, top: 16, zIndex: 10 } }}>
          Skip to main content
        </Link>
        <NavBar />

        {/* Programmatic focus lets the skip link move keyboard users into the page content. */}
        <Container component="main" id="main-content" tabIndex={-1} maxWidth="xl" sx={{ mt: { xs: 3, md: 5 }, mb: 4, flexGrow: 1, px: { xs: 2, md: 4 } }}>
          {isAuthenticated ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "188px minmax(0, 1fr)" },
                gap: { xs: 3, md: 4 },
              }}
            >
              <Box sx={{ gridColumn: { xs: "1", md: "2" }, gridRow: "1", minWidth: 0 }}>
                <Outlet />
                <EditProfileModal
                  onClose={() => dispatch(closeProfileModal())}
                  open={isProfileModalOpen}
                />
              </Box>
              {/* Mobile destinations stay fixed at the bottom instead of following long page content. */}
              <Box sx={{ display: { xs: "none", md: "block" }, gridColumn: "1", gridRow: "1" }}>
                <Sidebar />
              </Box>
            </Box>
          ) : (
            <Outlet />
          )}
        </Container>

        <Footer />
        {isAuthenticated && <MobileNavigation />}
      </Box>
    </Box>
  );
};

export default AppLayout;
