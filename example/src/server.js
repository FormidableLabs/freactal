import React from "react";
import { renderToString } from "react-dom/server";
import express from "express";
import webpack from "webpack";
import webpackMiddleware from "webpack-dev-middleware";
import { initialize } from "../../server";

import StatefulRootComponent from "./app";


const PORT = process.env.PORT || 1337;
Error.stackTraceLimit = Infinity;


const app = express();

app.use(webpackMiddleware(webpack({
  entry: "./src/index.js",
  output: {
    path: "/",
    filename: "main.js"
  },
  module: {
    loaders: [{
      test: /\.(js|jsx)$/,
      loader: "babel",
      include: __dirname
    }]
  }
}), {
  watchOptions: {
    aggregateTimeout: 300,
    poll: true
  },
  publicPath: "/assets/",
  stats: {
    colors: true
  }
}));

const boilerplate = (componentHtml, state) => `
  <html>
    <head><title>SSR Example</title></head>
    <body>
      <div id="root">${componentHtml}</div>
      <script type="text/javascript">
        window.__state__ = ${JSON.stringify(state)};
      </script>
      <script type="application/javascript" src="/assets/main.js" defer></script>
    </body>
  </html>
`;


app.route("/").get((req, res) => {
  initialize(<StatefulRootComponent rootProp="hello" />)
    .then(({ vdom, state }) => {
      const appHtml = renderToString(vdom);
      const html = boilerplate(appHtml, state);
      return res.send(html).end();
    })
    .catch(err => {
      console.log(err.stack || err);
    });
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}...`);
});
