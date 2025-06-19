import { Box, Button, Divider, Typography } from "@mui/material";
import Stack from "@mui/material/Stack";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../store/store";

const HomePage = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const navigate = useNavigate();

  const handleGetStarted = () => {
    isAuthenticated ? navigate("/dashboard") : navigate("/login");
  };

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Welcome to Aura Logbook
      </Typography>
      <Typography variant="h6" gutterBottom>
        Track your emotional well-being with insights, patterns, and powerful
        reflection tools.
      </Typography>
      <Box component="section">
        <Stack
          direction={"row"}
          spacing={2}
          sx={{
             p: 2, 
            m: 3,
            justifyContent: "center",
            alignItems: "center",
          }}>
          <Box>
            <Typography variant="h5">Log Your Mood</Typography>
          </Box>
          <Box>
            <Typography variant="h5">View Insights</Typography>
          </Box>
          <Box component="section">
            <Typography variant="h5">Reflect on Thoughts</Typography>
          </Box>
          <Box>
            <Typography variant="h5">Your Data is Private</Typography>
          </Box>
        </Stack>
      </Box>

      <Box m={4}>
        <Button variant="contained" onClick={handleGetStarted}>
          Get Started
        </Button>
      </Box>
      <Divider />
      <Typography></Typography>
    </Box>
  );
};

export default HomePage;
