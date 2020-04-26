import * as t from '@babel/types';
import generator from '@babel/generator';
import { parse } from '@babel/parser';

const stripFunctions = ['getInitialProps', 'serverSideFunctions'];

export default function loader(source: string) {
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['jsx'],
  });

  ast.program.body = [
    t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier('clientEntrypoint'),
          t.identifier('clientEntrypoint'),
        ),
      ],
      t.stringLiteral('nicessr/dist/csr/entrypoint'),
    ),
    ...ast.program.body.map(
      (statement: t.ExportDefaultDeclaration | t.ExportNamedDeclaration) => {
        switch (statement.type) {
          case 'ExportDefaultDeclaration':
            return t.expressionStatement(
              t.callExpression(t.identifier('clientEntrypoint'), [
                statement.declaration as any,
              ]),
            );
          case 'ExportNamedDeclaration':
            if (
              t.isIdentifier(statement.declaration.id) &&
              stripFunctions.includes(statement.declaration.id.name)
            )
              return null;
            break;
          default:
            break;
        }
        return statement;
      },
    ),
  ];

  const { code } = generator(ast.program);
  return code;
}
