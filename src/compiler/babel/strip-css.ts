import * as t from '@babel/types';
import sha256 from 'sha256';
import generator from '@babel/generator';

export default function () {
  return {
    visitor: {
      TaggedTemplateExpression(path) {
        if (t.isIdentifier(path.node.tag) && path.node.tag.name === 'css') {
          path.addComment(
            'leading',
            `css: ${sha256(generator(path.node).code)}`,
          );
          path.replaceWith(t.nullLiteral());
        }
      },
    },
  };
}
