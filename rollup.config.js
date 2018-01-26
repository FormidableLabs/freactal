import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
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
  external: ["react"],
  globals: {
    "react": "React"
  },
  plugins: [
    resolve(),
    commonjs({
      include: [
        "node_modules/**"
      ],
      namedExports: {
        // Manually specify named `import`s from CJS libraries
        "node_modules/prop-types/index.js": [
          "object"
        ]
      }
    }),
    babel()
  ]
};

if (process.env.NODE_ENV === "production") {
  config.plugins.push(uglify());
}

export default config;
