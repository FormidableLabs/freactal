import { provideState } from "../../..";

import * as effects from "./effects";
import initialState from "./initial-state";
import computed from "./computed";

export default provideState({ effects, initialState, computed });
