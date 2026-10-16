import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";

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
      <Typography level="body-sm" color="neutral">
        &copy; {new Date().getFullYear()} Aura Logbook — All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
