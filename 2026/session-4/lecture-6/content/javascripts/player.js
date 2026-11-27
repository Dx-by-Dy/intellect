import { drawTree } from "./tree.js";

function renderTable(table, data) {
  table.replaceChildren();
  if (data.caption) table.createCaption().textContent = data.caption;
  const header = table.createTHead().insertRow();
  const heading = (row, text, scope) => {
    const cell = document.createElement("th");
    cell.scope = scope;
    cell.textContent = text;
    row.append(cell);
  };
  for (const column of data.columns) heading(header, column, "col");
  const body = table.createTBody();
  data.rows.forEach(([label, ...values], index) => {
    const row = body.insertRow();
    if (index === data.highlight) row.className = "tree-demo-highlight";
    heading(row, label, "row");
    for (const value of values) row.insertCell().textContent = value;
  });
}

export function mountPlayer(marker, { label, parameters, trace }) {
  const root = document.createElement("section");
  root.className = "tree-demo";
  root.dataset.algorithm = marker.dataset.demo;
  root.tabIndex = 0;
  root.setAttribute("aria-label", label);
  root.innerHTML = `
    <div class="tree-demo-controls" data-role="parameters"></div>
    <div class="tree-demo-controls" data-role="navigation">
      <button type="button" data-action="restart">Сначала</button>
      <button type="button" data-action="previous">Назад</button>
      <button type="button" data-action="next">Дальше</button>
      <button type="button" data-action="finish">К ответу</button>
      <span class="tree-demo-count"></span>
    </div>
    <p class="tree-demo-status" role="status"></p>
    <div class="tree-demo-board">
      <div class="tree-demo-graph"><canvas width="960" height="524" role="img"></canvas></div>
      <div class="tree-demo-table"><table class="tree-demo-state"></table></div>
    </div>`;

  const settings = root.querySelector('[data-role="parameters"]');
  const navigation = root.querySelector('[data-role="navigation"]');
  const canvas = root.querySelector("canvas");
  const status = root.querySelector(".tree-demo-status");
  const count = root.querySelector(".tree-demo-count");
  const table = root.querySelector("table");
  const inputs = new Map();
  for (const { key, title, options, initial } of parameters) {
    const field = document.createElement("label");
    const name = document.createElement("span");
    name.textContent = title;
    const select = document.createElement("select");
    select.name = key;
    for (const option of options) {
      const [value, description] = Array.isArray(option) ? option : [option, option];
      select.add(new Option(description, value));
    }
    select.value = String(initial);
    inputs.set(key, select);
    field.append(name, select);
    settings.append(field);
  }

  let step = 0;
  let frames;
  const actions = {
    restart: () => 0,
    previous: () => step - 1,
    next: () => step + 1,
    finish: () => frames.length - 1,
  };

  function redraw() {
    drawTree(canvas, frames[step].graph);
  }

  function render() {
    const frame = frames[step];
    status.textContent = frame.message;
    count.textContent = `Шаг ${step} из ${frames.length - 1}`;
    for (const button of navigation.querySelectorAll("button")) {
      const target = actions[button.dataset.action]();
      button.setAttribute("aria-disabled", String(target === step || target < 0 || target >= frames.length));
    }
    renderTable(table, frame.table);
    redraw();
  }

  function rebuild() {
    const values = Object.fromEntries([...inputs].map(([key, select]) => [key, Number(select.value)]));
    frames = trace(values);
    step = 0;
    render();
  }

  function goTo(target) {
    if (target < 0 || target >= frames.length || target === step) return;
    step = target;
    render();
  }

  settings.addEventListener("change", rebuild);
  navigation.addEventListener("click", event => {
    const action = event.target.closest("button")?.dataset.action;
    if (action) goTo(actions[action]());
  });
  root.addEventListener("keydown", event => {
    if (event.target !== root && !navigation.contains(event.target)) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    goTo(step + (event.key === "ArrowLeft" ? -1 : 1));
  });

  marker.replaceWith(root);
  rebuild();
  const observer = new MutationObserver(redraw);
  observer.observe(document.body, { attributes: true, attributeFilter: ["data-md-color-scheme"] });
  return { root, disconnect: () => observer.disconnect() };
}
