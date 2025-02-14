import Didact from "../react-module";

const container = document.getElementById("root");

// /** @jsx Didact.createElement */
// const element = (
//   <h1 title="foo" style={{ backgroundColor: "skyblue" }}>
//     <a href="https://bilibili.com" target="_blank">
//       点击跳转b站
//     </a>
//     <div>only text node</div>
//   </h1>
// );

/**
 * base object
 */
// const base = {
//   type,
//   props,
//   ...chidren,
// };

const element = Didact.createElement(
  "h1",
  { title: "foo", style: { backgroundColor: "skyblue" } },
  Didact.createElement(
    "a",
    { href: "https://bilibili.com", target: "_blank" },
    "点击跳转b站"
  ),
  Didact.createElement("div", null, "only text node")
);

Didact.render(element, container);
