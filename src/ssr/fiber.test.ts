import { h } from '../csr/jsx/vdom';

import { renderFiber } from './fiber';

describe('Fiber renderer', () => {
  it('should render empty tags properly', () => {
    expect(renderFiber(h('div', {}))).toBe('<div></div>');
  });

  it('should render tags with children properly', () => {
    expect(renderFiber(h('div', { children: '123' }))).toBe('<div>123</div>');
    expect(renderFiber(h('div', { children: 123 }))).toBe('<div>123</div>');
    expect(renderFiber(h('div', { children: [123, 'Hello'] }))).toBe(
      '<div>123Hello</div>',
    );

    expect(
      renderFiber(
        h('div', { children: [h('p', { children: 'Hello' }), ', world!'] }),
      ),
    ).toBe('<div><p>Hello</p>, world!</div>');

    expect(
      renderFiber(h('div', { children: h('h1', { children: 'x_x' }) })),
    ).toBe('<div><h1>x_x</h1></div>');
  });

  it('should render elements with props properly', () => {
    expect(renderFiber(h('div', { class: 'test' }))).toBe(
      '<div class="test"></div>',
    );

    expect(renderFiber(h('div', { class: ['test', 'dev'] }))).toBe(
      '<div class="test dev"></div>',
    );
  });

  it('should render functional components properly', () => {
    const Title = ({ text }) => h('h1', { children: text });
    expect(renderFiber(h(Title, { text: 123 }))).toBe('<h1>123</h1>');

    const Container = ({ children }) =>
      h('div', { class: 'container', children });
    expect(
      renderFiber(h(Container, { children: h('h1', { children: 'Hi!' }) })),
    ).toBe('<div class="container"><h1>Hi!</h1></div>');
  });

  it('should render boolean props correctly', () => {
    expect(renderFiber(h('select', { name: 'test', required: true }))).toBe(
      '<select name="test" required></select>',
    );
  });

  it('should render fragments properly', () => {
    expect(
      renderFiber(h('Fragment', { children: [h('main', {}), h('aside', {})] })),
    ).toBe('<main></main><aside></aside>');
  });

  it('should escape html entities', () => {
    expect(renderFiber('&<test>')).toBe('&amp;&lt;test&gt;');
  });

  it('should render void tags properly', () => {
    expect(renderFiber(h('input', {}))).toBe('<input>');
    expect(renderFiber(h('img', {}))).toBe('<img>');

    expect(() => renderFiber(h('img', { children: h('div', {}) }))).toThrow();
  });
});
