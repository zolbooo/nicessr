/* eslint-disable */
import { h } from '../../csr/jsx/jsx-runtime';

export const pageTemplate = ({
  renderedMarkup,
  initialProps,
  entrypoints,
  stylesheets,
  styles,
}) => (
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style dangerouslySetInnerHTML={stylesheets} />
      {styles.map((style) => (
        <link rel="stylesheet" href={`/.nicessr/static/${style}`} />
      ))}
    </head>
    <body>
      <div id="__nicessr__root__" dangerouslySetInnerHTML={renderedMarkup} />
      <script
        type="applcation/json"
        id="__nicessr_initial_props__"
        dangerouslySetInnerHTML={initialProps}
      />
      {entrypoints.map((entrypoint) => (
        <script src={`/.nicessr/${entrypoint}`} />
      ))}
    </body>
  </html>
);

export const pageTemplateWithError = ({ entrypoints, errorData }) => (
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Error</title>
    </head>
    <body>
      <div id="__nicessr__root__" />
      <script
        type="applcation/json"
        id="__nicessr_ssr_error__"
        dangerouslySetInnerHTML={errorData}
      />
      {entrypoints.map((entrypoint) => (
        <script src={`/.nicessr/${entrypoint}`} />
      ))}
    </body>
  </html>
);
