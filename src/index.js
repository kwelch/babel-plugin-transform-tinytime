export default function({ types: t }) {
  const badCalls = new Set();

  return {
    name: "transform-tinytime", // not required
    visitor: {
      ImportDeclaration(path) {
        if (!looksLike(path.node, { source: { value: "tinytime" } })) {
          return;
        }
        const defaultSpecifier = path
          .get("specifiers")
          .find(p => p.isImportDefaultSpecifier());
        if (!defaultSpecifier) {
          return;
        }
        const refs = defaultSpecifier.scope.getBinding(
          defaultSpecifier.node.local.name
        ).referencePaths;
        refs.forEach(r => {
          if (r.findParent(t.isJSXElement) && r.parentPath.isCallExpression()) {
            badCalls.add(r.parentPath);
          }
        });
      },
      Program: {
        exit(program) {
          badCalls.forEach(call => {
            const id = program.scope.generateUidIdentifier("template");
            program.scope.push({ id, init: call.node });
            call.parent.object = id;
          });
        },
      },
    },
  };
}

function looksLike(a, b) {
  return (
    a &&
    b &&
    Object.keys(b).every(bKey => {
      const bVal = b[bKey];
      const aVal = a[bKey];
      if (typeof bVal === "function") {
        return bVal(aVal);
      }
      return isPrimitive(bVal) ? bVal === aVal : looksLike(aVal, bVal);
    })
  );
}

function isPrimitive(val) {
  return val == null || /^[sbn]/.test(typeof val);
}
