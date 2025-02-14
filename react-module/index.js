/**
 * 创建元素节点
 * @param {*} type
 * @param {*} props
 * @param {*} children
 * @returns
 */
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((item) =>
        typeof item === "object" ? item : createTextElement(item)
      ),
    },
  };
}

/**
 * 创建文本节点
 * @param {*} text
 * @returns
 */
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

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

const Didact = {
  createElement,
  render,
};

export default Didact;
