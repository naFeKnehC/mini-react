const createElement = (type, props, ...children) => {
  return {
    type,
    props: {
      ...props,
      children: children.map((item) =>
        typeof item === 'object' ? item : createTextElement(item),
      ),
    },
  };
};

const createTextElement = (text) => {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
};

const render = (element, container) => {
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  Object.keys(element.props)
    .filter((key) => key !== 'children')
    .forEach((key) => (dom[key] = element.props[key]));

  element.props.children.forEach((child) => render(child, dom));

  container.appendChild(dom);
};

const miniReact = {
  render,
  createElement,
};

// const referenceElement = (
//   <div id="foo">
//     <p>hello world</p>
//     <a target="_blank" href="www.bilibili.com" />
//   </div>
// );
const element = miniReact.createElement(
  'div',
  { id: 'foo' },
  miniReact.createElement('p', null, 'hello world'),
  miniReact.createElement(
    'a',
    { href: 'www.bilibili.com', target: '_blank' },
    'goto bilibili',
  ),
);

console.log(element, 'element');

const container = document.getElementById('root');

miniReact.render(element, container);
