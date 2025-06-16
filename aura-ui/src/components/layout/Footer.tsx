import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 2,
        px: 4,
        textAlign: "center",
        backgroundColor: "#f5f5f5",
      }}>
      <Typography variant="body2" color="text.secondary">
        &copy; {new Date().getFullYear()} Aura Logbook — All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
