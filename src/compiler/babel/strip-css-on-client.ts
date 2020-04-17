export default function () {
  return {
    visitor: {
      TaggedTemplateExpression(path) {
        if (path.node.tag.name === 'css') {
          path.replaceWith(require('@babel/types').nullLiteral());
        }
      },
    },
  };
}
