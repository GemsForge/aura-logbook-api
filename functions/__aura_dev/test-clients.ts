import { handleFitClients } from "../_lib/devToolbar";

/** Pages route: /__aura_dev/test-clients. Only synthetic labels and opaque IDs reach the browser. */
export const onRequestGet = handleFitClients;
