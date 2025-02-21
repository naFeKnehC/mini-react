/**
 * 渲染elemnt节点
 * @param {*} element
 * @param {*} container
 */
function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode(element.type)
      : document.createElement(element.type);

  Object.keys(element.props)
    .filter((key) => key !== "children")
    .forEach((propKey) => {
      dom[propKey] = element.props[propKey];
    });

  element.props.children.forEach((child) => {
    render(child, dom);
  });

  container.appendChild(dom);
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
function performUnitOfWork(nextUnitOfWork) {
  // todo
}

export default render;
