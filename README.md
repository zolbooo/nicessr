# nicessr

![npm](https://img.shields.io/npm/v/nicessr)

Nicessr - ES6-based simple framework for server-side-rendering

Simple server-side-rendering framework for static HTML generation. It lets you render markup using JSX syntax using props provided from server.

## Setup

- Create project: `npm init`
- Install nicessr: `npm install nicessr`
- Create `src/pages` directory
- Create some `.js` or `.jsx` file inside
- Run `npx nicessr`
- Open browser in `http://localhost:9000`

## Setup (development)

- Clone this repository
- Install dependencies: `npm install`
- Create `src/pages` directory
- Create some `.js` or `.jsx` file inside
- Run `npm run dev`
- Open browser in `http://localhost:9000`
- Edit code, server or pages will reload automatically

## Usage

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

## Contributing

All PRs and issues are welcome!
