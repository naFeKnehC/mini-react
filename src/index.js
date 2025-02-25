import Didact from "../react-module";

const container = document.getElementById("root");

// /** @jsx Didact.createElement */
// const element = (
//   <h1 title="foo" style={{ backgroundColor: "skyblue" }}>
//     <a href="https://bilibili.com" target="_blank">
//       点击跳转b站
//     </a>
//     <div>
//       <h2>h2 only text node</h2>
//       <h3>h3节点</h3>
//     </h2>
//   </h1>
// );

const element = Didact.createElement(
  "h1",
  { title: "foo", style: { backgroundColor: "skyblue" } },
  Didact.createElement(
    "a",
    { href: "https://bilibili.com", target: "_blank" },
    "点击跳转b站"
  ),
  Didact.createElement(
    "div",
    null,
    Didact.createElement(
      "div",
      null,
      Didact.createElement("h2", null, "h2 only text node"),
      Didact.createElement("h3", null, "h3节点")
    )
  )
);

Didact.render(element, container);
