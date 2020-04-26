import { h, Fiber } from '../../csr/jsx/vdom';
import { extractHeadChildren } from './head';

describe('Head tag extractor', () => {
  it('should extract head children properly', () => {
    const titleFiber = h('title', { children: 'Text' });
    const root = h('Fragment', {
      children: [h('head', { children: [titleFiber] }), h('div', {})],
    });

    expect(extractHeadChildren(root)[0]).toBe(titleFiber);
  });
  it('should remove head tags from the tree', () => {
    const titleFiber = h('title', { children: 'Text' });
    const root = h('Fragment', {
      children: [
        h('head', { children: [titleFiber] }),
        h('div', {
          children: [
            h('head', { children: [h('meta', {})] }),
            h('p', { children: 'Hi!' }),
          ],
        }),
      ],
    });

    extractHeadChildren(root);
    expect(root.props.children[0].elementName).toBe('div');
    expect(root.props.children[0].props.children[0].elementName).toBe('p');
  });
});
