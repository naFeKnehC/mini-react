/**
 * 创建dom节点
 * @param {*} fiber
 * @returns
 */
function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode(fiber.type)
      : document.createElement(fiber.type);

  Object.keys(fiber.props)
    .filter((key) => key !== 'children')
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
/**
 * 工作中的树，根节点
 */
let wipRoot = null;
/**
 * 上一次渲染的树，根节点
 */
let currentRoot = null;
/**
 * 需要删除的fiber节点
 */
let deleteOptions = null;

/**
 * 初始化首个工作单元，开始渲染
 * @param {*} element
 * @param {*} container
 */
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
    parent: null,
    sibling: null,
  };

  deleteOptions = [];
  nextUnitOfWork = wipRoot;
}

function commitRoot() {
  deleteOptions.forEach(commitWork);
  commitWork(wipRoot.child);

  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  /**
   * 存在type为function App的fiber节点
   * 此节点不存在dom节点
   * 删除/新增时，需要找到存在dom节点子/父节点
   * 更新时跳过函数类型的fiber节点
   */
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const parentDom = domParentFiber.dom;

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    parentDom.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, parentDom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, parentDom) {
  if (fiber.dom) {
    parentDom.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, parentDom);
  }
}

function updateDom(dom, prevProps, nextProps) {
  const unChildrenProp = (key) => key !== 'children';
  const isEvent = (key) => key.startsWith('on');

  // 清楚所有旧属性
  Object.keys(prevProps)
    .filter(unChildrenProp)
    .forEach((key) => (dom[key] = ''));

  //设置新属性
  Object.keys(nextProps)
    .filter(unChildrenProp)
    .forEach((key) => (dom[key] = nextProps[key]));

  // 清除所有旧事件
  Object.keys(prevProps)
    .filter(isEvent)
    .forEach((key) => {
      const eventType = key.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[key]);
    });

  // 绑定新事件
  Object.keys(nextProps)
    .filter(isEvent)
    .forEach((key) => {
      const eventType = key.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[key]);
    });
}

function workLoop(deadline) {
  // 是否应该停止工作`
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
 * 将当前fiber对象dom化
 * 将当fiber所有子节点的parent指针指向自身
 * 将child指向第一个子节点，child的sibiling指针依次指向下一个子节点
 * 返回下一个fiber
 * @param {*} fiber
 * @returns 返回优先级：child > sibling > parent
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;

  if (isFunctionComponent) {
    // 函数组件
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
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

const updateFunctionComponent = (fiber) => {
  const elements = [fiber.type(fiber.props)];
  reconcileChildren(fiber, elements);
};

const updateHostComponent = (fiber) => {
  // 检查当前fiber是否已经有对应的DOM节点
  if (!fiber.dom) {
    // 如果没有，则调用createDom函数为其创建一个DOM节点
    fiber.dom = createDom(fiber);
  }

  // 从当前fiber的props中取出所有子元素
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
};

/**
 * 当前fiber子元素fiber化，挂载关联关系
 * @param {*} wipFiber
 * @param {*} elements
 */
function reconcileChildren(wipFiber, elements) {
  // 用于记录前一个兄弟节点的指针
  let prevSibling = null;
  // 上一次渲染中当前fiber的child节点
  let oldChildFiber = wipFiber.alternate && wipFiber.alternate.child;
  let index = 0;

  // 遍历当前fiber的所有子元素，和旧fiber的所有子节点
  while (index < elements.length || oldChildFiber) {
    let newFiber = null;
    const element = elements[index];

    // 如果存在新的子节点和旧的子节点，且type相同，视为相同类型，可以复用dom节点，无需二次创建（优化点）
    const sameType =
      oldChildFiber && element && element.type === oldChildFiber.type;

    if (sameType) {
      // 存在相同类型节点，更新props即可
      // 真实的react 还使用 React.key 来确定是否做了移动
      newFiber = {
        type: oldChildFiber.type,
        props: element.props,
        parent: wipFiber,
        dom: oldChildFiber.dom,
        alternate: oldChildFiber,
        effectTag: 'UPDATE',
      };
    }
    if (element && !sameType) {
      // 存在新节点，且type不同，创建新节点
      newFiber = {
        type: element.type,
        props: element.props,
        parent: wipFiber,
        dom: null,
        alternate: null,
        effectTag: 'PLACEMENT',
      };
    }
    if (oldChildFiber && !sameType) {
      // 不存在新节点，且存在旧节点，删除旧节点
      oldChildFiber.effectTag = 'DELETION';
      deleteOptions.push(oldChildFiber);
    }

    // 如果是第一个子元素
    if (index === 0) {
      // 将其设置为当前fiber的子节点
      wipFiber.child = newFiber;
    } else {
      // 否则，将其设置为前一个兄弟节点的兄弟节点
      prevSibling.sibling = newFiber;
    }

    // 更新前一个兄弟节点的指针为当前新创建的fiber
    prevSibling = newFiber;

    // 如果存在旧节点，将其指向下一个兄弟节点
    oldChildFiber = oldChildFiber?.sibling;
    index++;
  }
}

export default render;
