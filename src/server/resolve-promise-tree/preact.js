const traverseTree = (obj, enter) => {
  if (obj && obj.children) {
    if (Array.isArray(obj.children)) {
      obj.children.forEach(
        (child, idx) => enter(obj.children, idx, child)
      );
    } else {
      enter(obj, "children", obj.children);
    }
  }
};

export const resolvePromiseTree = obj => {
  if (obj && typeof obj.then === "function") {
    return obj.then(resolvePromiseTree);
  }

  const leavesToResolve = [];

  const visitor = (parent, key, node) => {
    if (node && typeof node.then === "function") {
      leavesToResolve.push(node.then(resolvedValue => {
        parent[key] = resolvedValue;
        return resolvePromiseTree(resolvedValue);
      }));
    } else {
      traverseTree(node, visitor);
    }
  };

  traverseTree(obj, visitor);

  return Promise.all(leavesToResolve).then(() => obj);
};

