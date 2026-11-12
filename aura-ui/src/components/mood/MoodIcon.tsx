import Box from "@mui/joy/Box";
import { useState } from "react";

/** Renders a database-managed mood illustration as a decorative image, or nothing when its asset is unavailable. */
export function MoodIcon({ icon, size = 24 }: { icon?: string | null; size?: number }) {
  const [failedIcon, setFailedIcon] = useState<string | null>(null);
  if (!icon || !/^\/mood-icons\/[a-z0-9-]+\.png$/.test(icon) || failedIcon === icon) return null;

  return (
    <Box
      component="img"
      src={icon}
      alt=""
      aria-hidden="true"
      onError={() => setFailedIcon(icon)}
      sx={{ width: size, height: size, objectFit: "contain", flex: "0 0 auto", verticalAlign: "middle" }}
    />
  );
}
