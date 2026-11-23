import { observeGraph } from "./graph.js";

const example = [2, 6, 4, 9, 7];
const capacity = 15;
const minValue = -999;
const maxValue = 999;
const parentOf = index => Math.floor((index - 1) / 2);

function frame(values, message, active = [], kind = "change") {
  return { values: [...values], message, active, kind };
}

function traceInsertion(heap, value) {
  const values = [...heap, value];
  let index = values.length - 1;
  const steps = [frame(values, `Добавляем ${value} в конец массива, в ячейку ${index}.`, [index])];

  while (index > 0) {
    const parent = parentOf(index);
    const parentValue = values[parent];
    const pair = [index, parent];
    if (value >= parentValue) {
      steps.push(frame(values, `Сравниваем ${value} с родителем ${parentValue}. ${value} ≥ ${parentValue}, обмен не нужен.`, pair, "compare"));
      break;
    }

    steps.push(frame(values, `Сравниваем ${value} с родителем ${parentValue}. ${value} < ${parentValue}, нужен обмен.`, pair, "compare"));
    [values[parent], values[index]] = [value, parentValue];
    steps.push(frame(values, `Поменяли ${value} и ${parentValue} местами. ${value} поднялось в ячейку ${parent}.`, pair));
    index = parent;
  }

  const end = index === 0 ? `Число ${value} в корне.` : `Число ${value} осталось в ячейке ${index}.`;
  steps.push(frame(values, `${end} Вставка закончена. Минимум — ${values[0]}.`));
  return steps;
}

function traceRemoval(heap) {
  const values = [...heap];
  const minimum = values[0];
  const steps = [frame(values, `В корне находится минимум ${minimum}. Удаляем его.`, [0], "compare")];
  const last = values.pop();
  if (!values.length) {
    steps.push(frame(values, `Удалили ${minimum}. Куча пуста.`));
    return steps;
  }

  values[0] = last;
  steps.push(frame(values, `Перенесли ${last} из последней ячейки в корень. Проверяем порядок сверху вниз.`, [0]));
  let index = 0;
  while (2 * index + 1 < values.length) {
    const left = 2 * index + 1;
    const right = left + 1;
    const children = right < values.length ? [left, right] : [left];
    const child = children.reduce((best, candidate) => values[candidate] < values[best] ? candidate : best);
    const childValue = values[child];
    const moveDown = last > childValue;
    const selection = children.length === 1
      ? `У ${last} один ребёнок со значением ${childValue}.`
      : `Дети ${last} имеют значения ${values[left]} и ${values[right]}. Выбираем ${childValue} в ячейке ${child}.`;
    const comparison = moveDown ? `${last} > ${childValue}, нужен обмен.` : `${last} ≤ ${childValue}, обмен не нужен.`;
    steps.push(frame(values, `${selection} ${comparison}`, [index, ...children], "compare"));
    if (!moveDown) break;

    [values[index], values[child]] = [childValue, last];
    steps.push(frame(values, `Поменяли ${last} и ${childValue} местами. ${last} спустилось в ячейку ${child}.`, [index, child]));
    index = child;
  }

  steps.push(frame(values, `Удалили ${minimum}. Новый минимум — ${values[0]}.`));
  return steps;
}

function drawHeap(svg, { values, active, kind }) {
  svg.toggleAttribute("hidden", !values.length);
  if (!values.length) {
    svg.replaceChildren();
    return;
  }

  const width = svg.clientWidth;
  if (!width) return;
  const depth = Math.floor(Math.log2(values.length));
  const radius = Math.max(1, Math.min(21, (width / 2 ** depth - 4) / 2));
  const height = 48 + depth * 55;
  const activeCells = new Set(active);
  const positions = values.map((_, index) => {
    const level = Math.floor(Math.log2(index + 1));
    const slots = 2 ** level;
    return { x: width * (index + 1 - slots + 0.5) / slots, y: 24 + level * 55 };
  });

  const edges = positions.slice(1).map(({ x, y }, offset) => {
    const index = offset + 1;
    const parent = parentOf(index);
    const from = positions[parent];
    const style = activeCells.has(index) && activeCells.has(parent) ? kind : "";
    return `<line class="heap-edge ${style}" x1="${from.x}" y1="${from.y}" x2="${x}" y2="${y}"/>`;
  }).join("");
  const nodes = positions.map(({ x, y }, index) => {
    const style = activeCells.has(index) ? kind : "";
    const value = String(values[index]);
    const fontSize = radius < 18 ? 11 : 14;
    const fit = value.length === 4 && radius < 16 ? `textLength="${radius * 1.65}" lengthAdjust="spacingAndGlyphs"` : "";
    return `<g class="heap-node ${style}" transform="translate(${x} ${y})"><circle r="${radius}"/><text font-size="${fontSize}" ${fit}>${value}</text></g>`;
  }).join("");
  svg.style.height = `${height}px`;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = edges + nodes;
}

export function mount(marker) {
  const root = document.createElement("div");
  root.className = "lecture-demo heap-demo";
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "Пошаговая работа двоичной кучи");
  root.innerHTML = `
    <form class="demo-controls heap-actions" novalidate>
      <label class="heap-input">Целое число
        <input type="number" min="${minValue}" max="${maxValue}" step="1" value="3" required>
      </label>
      <button type="submit" data-action="insert">Вставить</button>
      <button type="button" data-action="remove">Удалить минимум</button>
      <button type="button" data-action="example">Загрузить пример</button>
      <button type="button" data-action="clear">Очистить</button>
    </form>
    <p class="demo-hint heap-limit">До ${capacity} элементов. Числа от −999 до 999.</p>
    <p class="heap-error" role="alert" hidden></p>
    <div class="demo-controls heap-steps">
      <button type="button" data-action="prev">◀ Назад</button>
      <button type="button" class="demo-primary" data-action="next">Шаг ▶</button>
      <span class="demo-count"></span>
    </div>
    <p class="demo-message" aria-live="polite"></p>
    <svg class="heap-tree" role="img" aria-label="Дерево минимальной кучи"></svg>
    <div class="demo-panel-title">Массив кучи · индексы с нуля</div>
    <ol class="heap-array" aria-label="Массив от индекса 0" tabindex="0"></ol>
    <p class="heap-empty" hidden>Массив пуст</p>`;

  const form = root.querySelector("form");
  const input = root.querySelector("input");
  const svg = root.querySelector("svg");
  const array = root.querySelector(".heap-array");
  const empty = root.querySelector(".heap-empty");
  const message = root.querySelector(".demo-message");
  const error = root.querySelector(".heap-error");
  const count = root.querySelector(".demo-count");
  const buttons = Object.fromEntries([...root.querySelectorAll("[data-action]")].map(button => [button.dataset.action, button]));
  let steps = [frame(example, "Попробуйте вставить 3, затем удалить минимум 2.")];
  let step = 0;

  function redraw() {
    drawHeap(svg, steps[step]);
  }

  function showError(text) {
    error.textContent = text;
    error.hidden = !text;
    input.setAttribute("aria-invalid", String(Boolean(text)));
  }

  function render() {
    const { values, active, kind, message: description } = steps[step];
    const done = step === steps.length - 1;
    buttons.insert.setAttribute("aria-disabled", String(!done || values.length === capacity));
    buttons.remove.setAttribute("aria-disabled", String(!done || !values.length));
    buttons.prev.setAttribute("aria-disabled", String(step === 0));
    buttons.next.setAttribute("aria-disabled", String(done));
    count.textContent = steps.length > 1 ? `шаг ${step + 1} из ${steps.length}` : "";
    message.textContent = description;
    array.hidden = !values.length;
    empty.hidden = Boolean(values.length);
    array.innerHTML = values.map((value, index) =>
      `<li class="${active.includes(index) ? kind : ""}" title="Индекс ${index}"><strong>${value}</strong></li>`).join("");
    const currentCell = array.children[active[0]];
    if (currentCell && array.scrollWidth > array.clientWidth) {
      const viewport = array.getBoundingClientRect();
      const cell = currentCell.getBoundingClientRect();
      if (cell.left < viewport.left) array.scrollLeft += cell.left - viewport.left;
      else if (cell.right > viewport.right) array.scrollLeft += cell.right - viewport.right;
    }
    redraw();
  }

  function show(nextSteps) {
    steps = nextSteps;
    step = 0;
    showError("");
    render();
  }

  function goTo(index) {
    if (index < 0 || index >= steps.length) return;
    step = index;
    render();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (buttons.insert.getAttribute("aria-disabled") === "true") return;
    if (!input.validity.valid) {
      showError("Введите целое число от −999 до 999.");
      input.focus();
      return;
    }
    show(traceInsertion(steps[step].values, input.valueAsNumber));
    input.value = "";
  });
  input.addEventListener("input", () => showError(""));
  buttons.remove.addEventListener("click", () => {
    if (buttons.remove.getAttribute("aria-disabled") === "true") return;
    show(traceRemoval(steps[step].values));
  });
  buttons.example.addEventListener("click", () => {
    input.value = "3";
    show([frame(example, "Попробуйте вставить 3, затем удалить минимум 2.")]);
  });
  buttons.clear.addEventListener("click", () => {
    input.value = "";
    show([frame([], "Куча пуста. Введите число и нажмите «Вставить».")]);
  });
  buttons.prev.addEventListener("click", () => goTo(step - 1));
  buttons.next.addEventListener("click", () => goTo(step + 1));

  marker.replaceWith(root);
  const disconnect = observeGraph(svg, redraw);
  render();
  return { root, disconnect };
}
