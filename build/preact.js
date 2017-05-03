const t = require("babel-types");

module.exports = () => ({
  visitor: {
    ImportDeclaration: path => {
      if (path.node.source.value === "react") {
        path.node.source.value = "preact";
        path.node.specifiers = path.node.specifiers
          .filter(specifier => {
            if (specifier.local.name === "React") { return false; }
            return true;
          })
          .concat([
            t.importSpecifier(
              t.identifier("h"),
              t.identifier("h")
            )
          ]);
      } else if (
        /\/context$/.test(path.node.source.value) &&
        path.node.specifiers.reduce((memo, specifier) => {
          return memo || specifier.imported.name === "contextTypes";
        }, false)
      ) {
        path.remove();
      } else if (path.node.source.value === "react-dom") {
        path.node.source.value = "preact";
      } else if (path.node.source.value === "react-dom/server") {
        path.node.source.value = "preact-render-to-string";
        path.node.specifiers[0].imported.name = "render";
      }
    },
    AssignmentExpression: path => {
      if (
        path.node.right.type === "Identifier" &&
        path.node.right.name === "contextTypes" &&
        path.node.left.type === "MemberExpression" &&
        path.node.left.property.type === "Identifier" &&
        (path.node.left.property.name === "contextTypes" ||
         path.node.left.property.name === "childContextTypes")
      ) {
        path.parentPath.remove();
      }
    }
  }
});
