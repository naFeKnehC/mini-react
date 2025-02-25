function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode(fiber.type)
      : document.createElement(fiber.type);

  Object.keys(fiber.props)
    .filter((key) => key !== "children")
    .forEach((propKey) => {
      dom[propKey] = fiber.props[propKey];
    });

  return dom;
}

/**
 * 渲染elemnt节点
 * @param {*} element
 * @param {*} container
 */
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
    parent: null,
  };
}

// 下一个工作单元
let nextUnitOfWork = null;

function workLoop(deadline) {
  // 是否应该停止工作
  let shouldYield = false;

  // 当存在下一个工作且不应该停止工作时
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 当前剩余时间小于1毫秒时，应该停止工作
    shouldYield = deadline.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);
}

/**
 * wndow.requestIdleCallback()方法用于告知浏览器，在浏览器有空闲时间时，可以执行指定的回调函数。
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 */
requestIdleCallback(workLoop);

// 处理当前传入的工作，并且返回下一个工作单元
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  const elements = fiber.props.children;
  let prevSibling = null;

  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
  }
  console.log(fiber, "fiber");
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

export default render;
