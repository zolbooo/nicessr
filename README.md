# nicessr

![Build and deploy](https://github.com/zolbooo/nicessr/workflows/Build%20and%20deploy/badge.svg?branch=master)
![npm](https://img.shields.io/npm/v/nicessr)
![GitHub last commit](https://img.shields.io/github/last-commit/zolbooo/nicessr)
[![commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Nicessr - ES6-based simple framework for server-side-rendering

Simple server-side-rendering framework for static HTML generation. It lets you render markup using JSX syntax using props provided from server.

## Setup

- Create project: `npm init -y`
- Install nicessr: `npm install nicessr`
- Create `src/pages` directory
- Create `index.js` inside, add some code from examples below
- Run `npx nicessr start`
- Open browser in `http://localhost:9000`

## Usage

### Available commands

- `start`: Start development server with auto reloading
- `build`: Build production bundle
- `serve`: Serve production bundle (**note**: You should run `build` command before `serve`)

### Examples

You should create pages under `src/pages` directory. Page file should look like this:

```jsx
function HomePage() {
  return <h1>Welcome to my home page!</h1>;
}

export default HomePage;
```

Pages should **always** have default export: function returning html. You can also leverage server-side rendering by creating `getInitialProps` exported function. It could be async, example:

```jsx
export async function getInitialProps() {
  return {
    number: await new Promise((resolve) => setTimeout(() => resolve(4), 1000)),
  };
}

function HomePage({ number }) {
  return <p>My favourite number is: ${number}</p>;
}

export default HomePage;
```

You can also attach functional props to html. There is `onMount` hook which will be called after DOM rendering and attaching event listeners. The only argument passed is element that has `onMount` hook:

```jsx
function Page() {
  return (
    <p
      onMount={(node) => {
        console.log(node);
      }}
    >
      Hi
    </p>
  );
}

export default Page;
```

When page is loaded, `<p>` element will be printed in console.

Also you can attach event listeners to components. Event names are as like the names in `addEventListener` function.

```jsx
function Page() {
  return <button click={() => console.log("I'm clicked!")}>Click me</button>;
}

export default Page;
```

When you click this button, `I'm clicked!` will be printed to console.

You can call `useRef` hook provided by `nicessr` package. Pass value returned by it to component, and its value will be set with rendered DOM node. Example:

```jsx
import { useRef } from 'nicessr';

function Home() {
  let counter = 0;
  const textRef = useRef();

  return (
    <>
      <p ref={textRef}>{counter}</p>
      <button click={() => (textRef.current.innerText = ++counter)}>
        Click me!
      </button>
    </>
  );
}

export default Home;
```

In example below, `textRef.current` value was set to `<p>` element during initial render.

You can include css in your components! Example:

```jsx
import { useRef } from 'nicessr';

const textStyles = css`
  color: red;
  font-size: 14px;
  background-color: white;
`;

function Home() {
  let counter = 0;
  const textRef = useRef();

  return (
    <>
      <p class={textStyles} ref={textRef}>
        {counter}
      </p>
      <button click={() => (textRef.current.innerText = ++counter)}>
        Click me!
      </button>
    </>
  );
}

export default Home;
```

You can use css tagged template literal for styles. This will be rendered only on server side, and be included in `<head>` tag of page. Classname will be as short as possible. Also you can pass array to `class` prop of component:

```jsx
const flexSpaceBetween = css`
  display: flex;
  justify-content: space-between;
`;

const redText = css`
  color: red;
`;

function Home() {
  return (
    <div class={[flexSpaceBetween, redText]}>
      <p>1</p>
      <p>2</p>
    </div>
  );
}

export default Home;
```

## Advanced

### App context

Value returned from `getInitialProps` function will be passed as first argument to page component.

**Warning**: currenly, all `getInitialProps` function exports are removed from client-side bundles.

There is `appContext` instance passed to `getInitialProps` function. It contains `req`, `res` props:
express `Request` and `Response` objects. You can also extend it by creating `src/pages/_app.js` file:

`src/pages/_app.js`:

```jsx
import { MongoClient } from 'mongodb';

// Dispose is called when _app.js is updated, use it for cleanup.
// For example: close connection to database, clearTimeouts, etc.
export function dispose(ctx) {
  ctx.client.close();
}

// Default export is called only on start and when _app.js is updated.
// It should return object that extends app context.
export default async function init() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  return { client, db: client.db('my-app') };
}
```

`src/pages/index.jsx`:

```jsx
// There are { client, db, req, res } props passed to getInitialProps function.
// { client, db } are created by init function in _app.js,
// { req, res } are express request and response objects
export async function getInitialProps({ db }) {
  return { items: await db.collection('items').find().toArray() };
}

function Home({ items }) {
  return <p>{JSON.stringify(items)}</p>;
}

export default Home;
```

### Compilator

There are extra babel plugins ran on builds (check `src/compiler/babel/`):

- `strip-css-on-client`: Removes `css` tagged template literals on client bundle
- `strip-get-initial-props`: Removes `getInitialProps` exported functions from **all** module on client bundle
- `strip-dev-code`: Removes `if (process.env.NODE_ENV === 'development')` statements on production bundle (both SSR and client bundles)

## Contributing

Check `CONTRIBUTING.md`

## Under the hood

Webpack is used internally for build (check out `src/compiler/index.ts`). Pages are built on-demand (only when are requested, look at `src/compiler/bundler/entrypoints.ts`), called on server-side using dynamic `require` (check out `src/ssr/index.ts`).
