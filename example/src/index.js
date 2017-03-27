import { default as React } from "react";
import { render } from "react-dom";
import StatefulApp from "./app";

render(<StatefulApp rootProp="hello" />, document.getElementById("root"));
