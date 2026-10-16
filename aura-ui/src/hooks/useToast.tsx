import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import Alert from "@mui/joy/Alert";
import IconButton from "@mui/joy/IconButton";
import Snackbar from "@mui/joy/Snackbar";

type ToastSeverity = "success" | "info" | "warning" | "error";

const joyColors = {
  success: "success",
  info: "primary",
  warning: "warning",
  error: "danger",
} as const;

type ToastContextType = {
  showToast: (message: string, severity?: ToastSeverity) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<ToastSeverity>("info");

  const showToast = useCallback((msg: string, sev: ToastSeverity = "info") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={(_, reason) => {
          if (reason !== "clickaway") handleClose();
        }}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert
          color={joyColors[severity]}
          variant="solid"
          endDecorator={
            <IconButton
              variant="plain"
              color={joyColors[severity]}
              size="sm"
              onClick={handleClose}
              aria-label="Dismiss notification">
              ×
            </IconButton>
          }
          sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
