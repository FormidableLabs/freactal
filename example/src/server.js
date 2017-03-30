import path from "path";

import React from "react";
import { renderToString } from "react-dom/server";
import express from "express";
import serveStatic from "serve-static";
import { initialize } from "../../server";

import StatefulRootComponent from "./app";


const PORT = process.env.PORT || 1337;
Error.stackTraceLimit = Infinity;


const app = express();

app.use(serveStatic(path.join(__dirname, "../build/static")));


const boilerplate = (componentHtml, state) => `
  <html>
    <head><title>SSR Example</title></head>
    <body>
      <div id="root">${componentHtml}</div>
      <script type="text/javascript">
        window.__state__ = ${JSON.stringify(state)};
      </script>
      <script type="application/javascript" src="/js/main.js" defer></script>
    </body>
  </html>
`;


app.route("/").get((req, res) => {
  initialize(<StatefulRootComponent />).then(({ vdom, state }) => {
    const appHtml = renderToString(vdom);
    const html = boilerplate(appHtml, state);
    return res.send(html).end()
  });
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}...`);
});





