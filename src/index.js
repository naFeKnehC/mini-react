import Didact from '../react-module';

const container = document.getElementById('root');

// /** @jsx Didact.createElement */
// const elementTemplate = (
//   <h1 title="foo" style={{ backgroundColor: 'skyblue' }}>
//     h1节点-初始值
//     <div>
//       <input onInput={handleChangeElement} />
//     </div>
//     <h2>value1</h2>
//   </h1>
// );

const handleChangeElement = (value) => {
  render(value);
};

const render = (value) => {
  const element = Didact.createElement(
    'h1',
    { title: 'foo', style: 'background-color: skyblue' },
    `h1节点-${value}`,
    Didact.createElement(
      'div',
      null,
      Didact.createElement(
        'input',
        { oninput: (e) => handleChangeElement(e.target.value) },
        null,
      ),
    ),
  );

  if (value === '1') {
    element.props.children.push(Didact.createElement('h2', null, 'value1'));
  } else {
    element.props.children = element.props.children.filter(
      (item) => item.type !== 'h2',
    );
  }

  Didact.render(element, container);
};

render('初始值');
