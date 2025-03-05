import Didact from '../react-module';

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

const container = document.getElementById('root');

// function App(params) {
//   return Didact.createElement('h1', null, `h1节点-${params.name}`);
// }

// const element = Didact.createElement(App, { name: '初始值' });

// Didact.render(element, container);

const handleChangeElement = (value) => {
  render(value);
};

function App({ value }) {
  return Didact.createElement(
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
}

const render = (value) => {
  const element = Didact.createElement(App, { value });

  // if (value === '1') {
  //   element.props.children.push(Didact.createElement('h2', null, 'value1'));
  // } else {
  //   element.props.children = element.props.children.filter(
  //     (item) => item.type !== 'h2',
  //   );
  // }

  Didact.render(element, container);
};

render('初始值');
