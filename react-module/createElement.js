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

export default createElement;
