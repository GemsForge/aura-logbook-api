import { handleFitStatus } from "../_lib/devToolbar";

/** Pages route: /__aura_dev/status. The companion returns only a safe FIT readiness state. */
export const onRequestGet = handleFitStatus;
