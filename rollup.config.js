import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";

const name = process.env.NODE_ENV === "production"
  ? "freactal.umd.min.js"
  : "freactal.umd.js";

const config = {
  input: "./src/index.js",
  output: {
    file: `./umd/${name}`,
    directory: "umd",
    format: "umd"
  },
  name: "Freactal",
  external: ["react", "prop-types"],
  globals: {
    "react": "React",
    "prop-types": "PropTypes"
  },
  plugins: [
    babel()
  ]
};

if (process.env.NODE_ENV === "production") {
  config.plugins.push(uglify());
}

export default config;
