import boobaConfigs from "./booba";
import fcFleetConfigs from "./fc-fleet";

const configs = {
  booba: boobaConfigs,
  fleet: fcFleetConfigs,
};

export const APP_TYPE =
  import.meta.env.VITE_APP_TYPE === "booba" ? "booba" : "fleet";

export default configs[APP_TYPE];
