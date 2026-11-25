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
import { useAppDispatch } from "@/store/hooks";
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
      setDetail(error instanceof Error ? error.message : "The local API action failed.");
    } finally {
      setPendingAction("");
    }
  };

  const selectClient = async (_event: SyntheticEvent | null, clientId: string | null) => {
    setSelectedClient(clientId);
    if (!clientId) return;
    const client = clients.find(item => item.id === clientId);
    if (!client) return;
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
      setDetail(error instanceof Error ? error.message : "Synthetic sign-in failed.");
      showToast("Test-client sign-in failed. Check the local launcher and API.", "error");
    } finally {
      setSelectedClient(null);
      setPendingAction("");
    }
  };

  const stateText = { starting: "Starting", ready: "Ready", stopped: "Stopped", failed: "Failed" }[apiState];

  return (
    <Sheet component="aside" aria-label="Developer console" variant="solid" color="neutral"
      sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, px: { xs: 1.5, sm: 2.5 }, py: 1, borderRadius: 0, backgroundColor: "#15232a", color: "#f5f3ed" }}>
      <Box sx={{ minWidth: 108 }}>
        <Typography level="title-sm" sx={{ color: "inherit", letterSpacing: ".06em" }}>DEV CONSOLE</Typography>
        <Typography level="body-xs" sx={{ color: "#c6d1d3" }}>{developerEnvironment} API · {stateText}</Typography>
      </Box>
      {localApiControlsEnabled && <Box role="group" aria-label="Local API controls" sx={{ display: "flex", gap: 0.5 }}>
        <Button size="sm" variant="outlined" color="neutral" disabled={pendingAction !== "" || apiState === "ready"} onClick={() => void runApiAction("start")}>Start API</Button>
        <Button size="sm" variant="outlined" color="neutral" disabled={pendingAction !== "" || apiState === "stopped"} onClick={() => void runApiAction("stop")}>Stop</Button>
        <Button size="sm" variant="outlined" color="neutral" disabled={pendingAction !== ""} onClick={() => void runApiAction("restart")}>Restart</Button>
      </Box>}
      <FormControl size="sm" sx={{ minWidth: 190, ml: { sm: "auto" } }}>
        <FormLabel sx={{ color: "#d7dfdf", mb: 0.25 }}>Synthetic test client</FormLabel>
        <Select size="sm" variant="outlined" placeholder={clients.length ? "Choose a test client" : "No clients configured"}
          value={selectedClient} onChange={selectClient} disabled={pendingAction !== "" || !clients.length || apiState !== "ready"}
          slotProps={{ button: { "aria-label": "Synthetic test client" } }}
          sx={{ "--Select-focusedHighlight": "#6f9b93", color: "#f5f3ed", backgroundColor: "rgba(255,255,255,.08)" }}>
          {clients.map(client => <Option key={client.id} value={client.id}>{client.label}</Option>)}
        </Select>
      </FormControl>
      <Typography role={configurationError ? "alert" : "status"} aria-live={configurationError ? "assertive" : "polite"} level="body-xs"
        sx={{ width: { xs: "100%", sm: "auto" }, minWidth: 120, color: configurationError ? "#ffd4b8" : "#d7dfdf" }}>
        {configurationError || detail}
      </Typography>
    </Sheet>
  );
}
