/**
 * 创建dom节点
 * @param {*} fiber
 * @returns
 */
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
 * 下一个工作单元
 * 其实本质就是一个fiber对象
 */
let nextUnitOfWork = null;
let wipRoot = null;

/**
 * 创建首个工作单元，开始渲染
 * @param {*} element
 * @param {*} container
 */
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    parent: null,
    sibling: null,
  };

  nextUnitOfWork = wipRoot;
}

function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  const parentDom = fiber.parent.dom;
  parentDom.appendChild(fiber.dom);

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function workLoop(deadline) {
  // 是否应该停止工作
  let shouldYield = false;

  // 当存在下一个工作且不应该停止工作时
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 当前剩余时间小于1毫秒时，应该停止工作
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 当没有下一个工作单元且存在正在工作中的树时
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

/**
 * wndow.requestIdleCallback()方法用于告知浏览器，在浏览器有空闲时间时，可以执行指定的回调函数。
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 */
requestIdleCallback(workLoop);

/**
 * 将当前fiber对象dom化，并插入至父节点
 * 将当fiber所有子节点的parent指针指向自身
 * 将child指向第一个子节点，child的sibiling指针依次指向下一个子节点
 * 返回下一个fiber
 * @param {*} fiber
 * @returns 返回优先级：child > sibling > parent
 */
function performUnitOfWork(fiber) {
  // 检查当前fiber是否已经有对应的DOM节点
  if (!fiber.dom) {
    // 如果没有，则调用createDom函数为其创建一个DOM节点
    fiber.dom = createDom(fiber);
  }

  // 从当前fiber的props中取出所有子元素
  const elements = fiber.props.children;
  // 用于记录前一个兄弟节点的指针
  let prevSibling = null;

  // 遍历当前fiber的所有子元素
  for (let index = 0; index < elements.length; index++) {
    const element = elements[index];

    // 为每个子元素创建一个新的fiber对象，并设置其父节点为当前fiber
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    // 如果是第一个子元素
    if (index === 0) {
      // 将其设置为当前fiber的子节点
      fiber.child = newFiber;
    } else {
      // 否则，将其设置为前一个兄弟节点的兄弟节点
      prevSibling.sibling = newFiber;
    }

    // 更新前一个兄弟节点的指针为当前新创建的fiber
    prevSibling = newFiber;
  }

  // 检查当前fiber是否有子节点
  if (fiber.child) {
    // 如果有，则返回其子节点作为下一个要处理的fiber
    return fiber.child;
  }

  /**
   * 当前节点不存在可返回子节点时
   * 设置当前节点为循环条件，进入循环，如果存在兄弟节点则返回兄弟
   * 若不存在兄弟节点，则设置父节点为循环条件，来返回父节点的兄弟节点
   * 以此向上递归，直到根节点不存在兄弟与父节点，返回undefined，结束workLoop循环
   */
  let nextFiber = fiber;
  // 循环查找下一个要处理的fiber
  while (nextFiber) {
    // 检查当前fiber是否有兄弟节点
    if (nextFiber.sibling) {
      // 如果有，则返回其兄弟节点作为下一个要处理的fiber
      return nextFiber.sibling;
    }
    // 如果没有兄弟节点，则将当前fiber的父节点作为下一个要处理的fiber
    nextFiber = nextFiber.parent;
  }
}

export default render;
