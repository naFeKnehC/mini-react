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

  updateDom(dom, {}, fiber.props);

  return dom;
};

function updateDom(dom, prevProps, nextProps) {
  const isProperty = (key) => key !== 'children';
  const isEvent = (key) => key.startsWith('on');

  Object.keys(prevProps || {})
    .filter(isEvent)
    .forEach((key) => {
      const eventType = key.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[key]);
    });

  Object.keys(prevProps || {})
    .filter(isProperty)
    .forEach((key) => (dom[key] = ''));

  Object.keys(nextProps || {})
    .filter(isProperty)
    .forEach((key) => (dom[key] = nextProps[key]));

  Object.keys(nextProps || {})
    .filter(isEvent)
    .forEach((key) => {
      const eventType = key.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[key]);
    });
}

const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };

  deletions = [];

  nextUnitOfWork = wipRoot;
};

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;

function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (wipRoot && !nextUnitOfWork) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  const domParent = fiber.parent.dom;
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    domParent.appendChild(fiber.dom);
  }
  if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom);
  }
  if (fiber.effectTag === 'UPDATE') {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function performUnitOfWork(nextUnitOfWork) {
  const fiber = nextUnitOfWork;

  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

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

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (index < elements.length || !!oldFiber) {
    const element = elements[index];
    let newFiber = null;

    const sameType = oldFiber && element && oldFiber.type === element.type;

    if (sameType) {
      newFiber = {
        parent: wipFiber,
        dom: oldFiber.dom,
        alternate: oldFiber,
        type: oldFiber.type,
        props: element.props,
        effectTag: 'UPDATE',
      };
    }

    if (!sameType && element) {
      newFiber = {
        parent: wipFiber,
        dom: null,
        alternate: null,
        type: element.type,
        props: element.props,
        effectTag: 'PLACEMENT',
      };
    }

    if (!sameType && oldFiber) {
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

const miniReact = {
  render,
  createElement,
};

const container = document.getElementById('root');

const updateValue = (e) => {
  initRender(e.target.value);
};

// const referenceElement = (
//   <div id="foo">
//     <p>hello world</p>
//     <input onInput={updateValue} />
//     <a target="_blank" href="www.bilibili.com">
//       goto bilibili
//     </a>
//   </div>
// );

function initRender(value) {
  const element = miniReact.createElement(
    'div',
    { id: 'foo' },
    value.substring(value.length - 1, value.length) === '1'
      ? miniReact.createElement('h1', null, '111')
      : miniReact.createElement('h2', null, '222'),
    miniReact.createElement(
      'input',
      {
        onInput: updateValue,
      },
      '',
    ),
    // miniReact.createElement(
    //   'a',
    //   {
    //     href: 'https://www.bilibili.com',
    //     target: '_blank',
    //     style: 'color: blue;display: block;',
    //   },
    //   value,
    // ),
  );

  miniReact.render(element, container);
}

initRender('please input');
