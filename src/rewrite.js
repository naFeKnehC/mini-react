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

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    domParent.appendChild(fiber.dom);
  }
  if (fiber.effectTag === 'DELETION' && fiber) {
    commitDeletion(fiber, domParent);
  }
  if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function performUnitOfWork(nextUnitOfWork) {
  const fiber = nextUnitOfWork;

  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
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

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState(initial) {
  const oldFier = wipFiber.alternate;
  const oldHook = oldFier && oldFier.hooks && oldFier.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];

  actions.forEach((action) => {
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  });

  const setState = (action) => {
    hook.queue.push(action);

    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
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
  useState,
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

function App() {
  const [state, setState] = miniReact.useState(1);

  return miniReact.createElement(
    'div',
    {
      id: 'foo',
      onClick: () => {
        // 测试直接更新
        // setState(state + 1);
        // setState(state + 1);
        // setState(state + 1);
        // // 测试函数式更新
        setState((s) => s + 1);
        setState((s) => s + 1);
        // setState((s) => s + 1);
      },
    },
    'add num (click to test both update styles)',
    miniReact.createElement('h1', null, state),
    miniReact.createElement(
      'input',
      {
        onInput: updateValue,
      },
      '',
    ),
  );
}

const element = miniReact.createElement(App);

miniReact.render(element, container);
