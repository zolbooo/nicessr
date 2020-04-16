export default function () {
  return {
    visitor: {
      ExportNamedDeclaration(path) {
        if (path.node.declaration.id.name === 'getInitialProps') {
          path.remove();
        }
      },
    },
  };
}
