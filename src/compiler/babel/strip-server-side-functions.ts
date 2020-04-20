export default function () {
  return {
    visitor: {
      ExportNamedDeclaration(path) {
        if (path.node.declaration.id.name === 'serverSideFunctions') {
          path.remove();
        }
      },
    },
  };
}
