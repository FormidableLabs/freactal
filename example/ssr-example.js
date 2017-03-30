import React from "react";
import { renderToString } from "react-dom/server";
import { initialize } from "../server";

import StatefulRootComponent from "./src/app";

Error.stackTraceLimit = Infinity;

initialize(<StatefulRootComponent />)
  .then(({ vdom, state }) => {
    console.log("==================================== STATE =====================================");
    console.log("state", state);
    console.log("\n==================================== HTML ======================================");
    const html = renderToString(vdom);
    console.log(html);
  })
  .catch(err => {
    console.log(err && err.stack ? err.stack : err);
  });
