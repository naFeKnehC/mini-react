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

/**
 * 根据fiber对象创建dom节点
 * @param {*} fiber
 */
const createDom = (fiber) => {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  Object.keys(fiber.props)
    .filter((key) => key !== 'children')
    .forEach((key) => (dom[key] = fiber.props[key]));

  return dom;
};

const render = (element, container) => {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
};

let nextUnitOfWork = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(nextUnitOfWork) {
  const fiber = nextUnitOfWork;

  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  const elements = fiber.props.children;

  let index = 0;
  let prevSibling = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
      parent: fiber,
      dom: null,
      type: element.type,
      props: element.props,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

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
    { href: 'https://www.bilibili.com', target: '_blank' },
    'goto bilibili',
  ),
);

const container = document.getElementById('root');

miniReact.render(element, container);
