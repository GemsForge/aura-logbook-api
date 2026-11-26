import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import { hydrateUserSession } from "@/api/hydrateUserSession";
import api from "@/api/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Modal from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import DialogTitle from "@mui/joy/DialogTitle";
import DialogContent from "@mui/joy/DialogContent";
import DialogActions from "@mui/joy/DialogActions";
import { useToast } from "@/hooks/useToast";
import { authApi } from "@/store/authApi";
import { auraApi } from "@/store/auraApi";
import { moodApi } from "@/store/moodApi";
import { referenceDataApi } from "@/store/referenceDataApi";
import { spotifyApi } from "@/store/spotifyApi";
import { weatherApi } from "@/store/weatherApi";
import { logout } from "@/store/slices/authSlice";

type ApiState = "starting" | "ready" | "stopped" | "failed";
type TestClient = { id: string; label: string };
const localApiControlsEnabled = import.meta.env.DEV;
const developerEnvironment = import.meta.env.VITE_AURA_ENV ?? (import.meta.env.MODE === "fit" ? "FIT" : "DEV");
/** Light-on-dark control styling so enabled buttons read as active and disabled ones as dimmed on the toolbar background. */
const toolbarButtonSx = {
  color: "#f5f3ed", borderColor: "rgba(245,243,237,.55)",
  "&:hover": { backgroundColor: "rgba(255,255,255,.12)" },
  "&.Mui-disabled": { color: "rgba(245,243,237,.38)", borderColor: "rgba(245,243,237,.18)" },
};

/** Runs only in local Vite development; credentials remain inside the loopback launcher. */
export function DeveloperToolbar() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [apiState, setApiState] = useState<ApiState>("starting");
  const [detail, setDetail] = useState("Checking local API readiness.");
  const [clients, setClients] = useState<TestClient[]>([]);
  const [configurationError, setConfigurationError] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState("");
  // Action and sign-in failures stay visible until the next user action; the status poll only updates `detail`.
  const [actionError, setActionError] = useState("");
  // Client chosen while another user is signed in; switching waits for explicit confirmation because it discards unsaved work.
  const [pendingSwitch, setPendingSwitch] = useState<TestClient | null>(null);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch("/__aura_dev/status", { cache: "no-store" });
      const result = await response.json() as { state?: ApiState; detail?: string };
      setApiState(result.state ?? "failed");
      setDetail(result.detail ?? "The API status response was incomplete.");
    } catch {
      setApiState("failed");
      setDetail("The local launcher is unavailable. Restart npm run dev to reconnect.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadClients = async () => {
      try {
        const response = await fetch("/__aura_dev/test-clients", { cache: "no-store" });
        const result = await response.json() as { clients?: TestClient[]; error?: string };
        if (!cancelled) {
          setClients(Array.isArray(result.clients) ? result.clients : []);
          setConfigurationError(result.error ?? "");
        }
      } catch {
        if (!cancelled) setConfigurationError("The local test-client helper is unavailable.");
      }
    };
    void loadClients();
    void refreshStatus();
    const timer = window.setInterval(() => void refreshStatus(), 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [refreshStatus]);

  const runApiAction = async (action: "start" | "stop" | "restart") => {
    setPendingAction(action);
    setActionError("");
    setDetail(`API ${action} requested.`);
    try {
      const response = await fetch("/__aura_dev/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The local API action failed.");
      await refreshStatus();
    } catch (error) {
      setApiState("failed");
      setActionError(error instanceof Error ? error.message : "The local API action failed.");
    } finally {
      setPendingAction("");
    }
  };

  /** Asks for confirmation before replacing an active session; signs in directly when nobody is signed in. */
  const selectClient = (_event: SyntheticEvent | null, clientId: string | null) => {
    setActionError("");
    const client = clientId ? clients.find(item => item.id === clientId) : undefined;
    if (!client) return;
    if (isAuthenticated) {
      setSelectedClient(null);
      setPendingSwitch(client);
      return;
    }
    void signInAs(client);
  };

  /** Clears the current session and caches, then signs in as the chosen synthetic client. */
  const signInAs = async (client: TestClient) => {
    const clientId = client.id;
    setSelectedClient(clientId);
    setPendingAction("login");
    try {
      // Drop every user-scoped query cache before replacing the active bearer token.
      delete api.defaults.headers.common.Authorization;
      dispatch(logout());
      dispatch(authApi.util.resetApiState());
      dispatch(auraApi.util.resetApiState());
      dispatch(moodApi.util.resetApiState());
      dispatch(referenceDataApi.util.resetApiState());
      dispatch(spotifyApi.util.resetApiState());
      dispatch(weatherApi.util.resetApiState());
      const response = await fetch("/__aura_dev/test-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const result = await response.json() as { token?: string; error?: string };
      if (!response.ok || !result.token) throw new Error(result.error ?? "Synthetic sign-in failed.");
      const user = await hydrateUserSession(result.token, dispatch);
      if (!user) throw new Error("Signed in, but the selected test profile could not be loaded.");
      showToast(`Signed in as ${client.label}.`, "success");
      window.location.assign("/dashboard");
    } catch (error) {
      delete api.defaults.headers.common.Authorization;
      dispatch(logout());
      setActionError(error instanceof Error ? error.message : "Synthetic sign-in failed.");
      showToast("Test-client sign-in failed. Check the local launcher and API.", "error");
    } finally {
      setSelectedClient(null);
      setPendingAction("");
    }
  };

  const stateText = { starting: "Starting", ready: "Ready", stopped: "Stopped", failed: "Failed" }[apiState];

  return (
    <>
    <Sheet component="aside" aria-label="Developer console" variant="solid" color="neutral"
      sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, px: { xs: 1.5, sm: 2.5 }, py: 1, borderRadius: 0, backgroundColor: "#15232a", color: "#f5f3ed" }}>
      <Box sx={{ minWidth: 108 }}>
        <Typography level="title-sm" sx={{ color: "inherit", letterSpacing: ".06em" }}>DEV CONSOLE</Typography>
        <Typography level="body-xs" sx={{ color: "#c6d1d3" }}>{developerEnvironment} API · {stateText}</Typography>
      </Box>
      {localApiControlsEnabled && <Box role="group" aria-label="Local API controls" sx={{ display: "flex", gap: 0.5 }}>
        <Button size="sm" variant="outlined" color="neutral" sx={toolbarButtonSx} disabled={pendingAction !== "" || apiState === "ready"} onClick={() => void runApiAction("start")}>Start API</Button>
        <Button size="sm" variant="outlined" color="neutral" sx={toolbarButtonSx} disabled={pendingAction !== "" || apiState === "stopped"} onClick={() => void runApiAction("stop")}>Stop</Button>
        <Button size="sm" variant="outlined" color="neutral" sx={toolbarButtonSx} disabled={pendingAction !== ""} onClick={() => void runApiAction("restart")}>Restart</Button>
      </Box>}
      <FormControl size="sm" sx={{ minWidth: 190, ml: { sm: "auto" } }}>
        <FormLabel sx={{ color: "#d7dfdf", mb: 0.25 }}>Synthetic test client</FormLabel>
        <Select size="sm" variant="outlined" placeholder={clients.length ? "Choose a test client" : "No clients configured"}
          value={selectedClient} onChange={selectClient} disabled={pendingAction !== "" || !clients.length || apiState !== "ready"}
          slotProps={{ button: { "aria-label": "Synthetic test client" }, // The app header uses z-index 1100; keep the option list above it so options stay clickable.
            listbox: { sx: { zIndex: 1200 } } }}
          sx={{ "--Select-focusedHighlight": "#6f9b93", color: "#f5f3ed", backgroundColor: "rgba(255,255,255,.08)" }}>
          {clients.map(client => <Option key={client.id} value={client.id}>{client.label}</Option>)}
        </Select>
      </FormControl>
      <Typography role={configurationError ? "alert" : "status"} aria-live={configurationError ? "assertive" : "polite"} level="body-xs"
        sx={{ width: { xs: "100%", sm: "auto" }, minWidth: 120, color: configurationError ? "#ffd4b8" : "#d7dfdf" }}>
        {configurationError || actionError || detail}
      </Typography>
    </Sheet>
    {/* Joy Modal: the toolbar renders outside the app MUI theme provider, so Material-based AuraModal cannot be used here. */}
    <Modal open={pendingSwitch !== null} onClose={() => setPendingSwitch(null)}>
      <ModalDialog role="alertdialog" aria-labelledby="dev-switch-title" size="sm" color="warning" variant="outlined">
        <DialogTitle id="dev-switch-title">Switch test client?</DialogTitle>
        <DialogContent>
          You will be signed out of the current session and signed in as {pendingSwitch?.label}. Unsaved changes on this page will be lost.
        </DialogContent>
        <DialogActions>
          <Button variant="solid" color="warning" onClick={() => { const client = pendingSwitch; setPendingSwitch(null); if (client) void signInAs(client); }}>
            Switch to {pendingSwitch?.label}
          </Button>
          <Button variant="plain" color="neutral" onClick={() => setPendingSwitch(null)}>Cancel</Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
    </>
  );
}
