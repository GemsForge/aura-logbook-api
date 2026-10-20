import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { prismGarden } from "@/theme";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 2.5,
        px: 3,
        textAlign: "center",
        backgroundColor: "rgba(237, 229, 217, 0.58)",
        borderTop: "1px solid",
        borderColor: prismGarden.color.line,
      }}>
      <Typography level="body-sm" sx={{ color: prismGarden.color.inkMuted }}>
        &copy; {new Date().getFullYear()} Aura Logbook · A moment for yourself.
      </Typography>
    </Box>
  );
};

export default Footer;
