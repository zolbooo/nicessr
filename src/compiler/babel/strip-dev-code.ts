import * as t from '@babel/types';

export default function () {
  return {
    visitor: {
      IfStatement(path) {
        if (!t.isBinaryExpression(path.node.test, { operator: '===' })) return;
        if (!t.isMemberExpression(path.node.test.left)) return;
        if (
          !t.isIdentifier(path.node.test.left.property, {
            name: 'NODE_ENV',
          })
        )
          return;
        if (!t.isMemberExpression(path.node.test.left.object)) return;
        if (
          !t.isIdentifier(path.node.test.left.object.property, {
            name: 'env',
          })
        )
          return;
        if (
          !t.isIdentifier(path.node.test.left.object.object, {
            name: 'process',
          })
        )
          return;
        if (
          !t.isStringLiteral(path.node.test.right, {
            value: 'development',
          })
        )
          return;
        path.remove();
      },
    },
  };
}
