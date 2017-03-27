import { withState } from "../../..";

import * as effects from "./effects";
import initialState from "./initial-state";
import computed from "./computed";

export default withState({ effects, initialState, computed });
