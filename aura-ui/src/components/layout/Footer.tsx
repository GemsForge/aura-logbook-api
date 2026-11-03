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
        backgroundColor: "transparent",
      }}>
      <Typography level="body-sm" color="neutral">
        &copy; {new Date().getFullYear()} Aura Logbook · A quiet place to notice what matters.
      </Typography>
    </Box>
  );
};

export default Footer;
