import { handleFitTestLogin } from "../_lib/devToolbar";

/** Pages route: /__aura_dev/test-login. Credentials stay in encrypted FIT Function variables. */
export const onRequestPost = handleFitTestLogin;
