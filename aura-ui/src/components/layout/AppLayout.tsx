import { Box, Container } from "@mui/material";
import { Footer, NavBar, Sidebar } from ".";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar - Fixed width */}
      <Sidebar />

      {/* Main content area */}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <NavBar />

        <Container sx={{ mt: 4, flexGrow: 1 }}>
          <Outlet />
        </Container>

        <Footer />
      </Box>
    </Box>
  );
};

export default AppLayout;
