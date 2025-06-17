import { Drawer, List, ListItem, ListItemText } from "@mui/material";
import { Link } from "react-router-dom";

const Sidebar = () => (
  <Drawer
    sx={{
      width: "100px", // Fixed width
      bgcolor: "grey.100",
      height: "100vh",
      p: 2,
    }}
    variant="permanent"
    anchor="left">
    <List>
      <ListItem component={Link} to="/dashboard">
        <ListItemText primary="Dashboard" />
      </ListItem>
      <ListItem component={Link} to="/log-mood">
        <ListItemText primary="Log Mood" />
      </ListItem>
      {/* Add more links here */}
    </List>
  </Drawer>
);

export default Sidebar;
