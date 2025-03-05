/**
 * 创建元素节点
 * @param {*} type
 * @param {*} props
 * @param {*} children
 * @returns
 */
function createElement(type, props, ...childrens) {
  // input 元素等不存在子元素，childrens 可能为 null[]
  const notNull = (value) => value !== null;

  return {
    type,
    props: {
      ...props,
      children: childrens
        .filter(notNull)
        .map((item) =>
          typeof item === 'object' ? item : createTextElement(item),
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
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export default createElement;
