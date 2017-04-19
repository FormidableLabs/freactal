/* global __dirname */
const { resolve } = require("path");


const freactalRoot = /^freactal(?=\/)/;
const replacement = resolve(__dirname, "../..");


module.exports = () => ({
  visitor: {
    ImportDeclaration (path) {
      path.node.source.value = path.node.source.value.replace(freactalRoot, replacement);
    }
  }
});
