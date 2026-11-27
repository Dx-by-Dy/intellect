import { mountPlayer } from "./player.js";
import { edgeKey, pathBetween, pathEdges, tree, vertices } from "./tree.js";

const heavy = {};
const head = {};
const order = [];
const pos = {};
for (const v of vertices) {
  heavy[v] = tree.children[v].reduce((best, child) => tree.size[child] > (tree.size[best] || 0) ? child : best, 0);
}
const heavyEdges = vertices.filter(v => heavy[v]).map(v => edgeKey(v, heavy[v]));

function visit(v, top) {
  head[v] = top;
  pos[v] = order.length;
  order.push(v);
  if (heavy[v]) visit(heavy[v], top);
  for (const child of tree.children[v]) {
    if (child !== heavy[v]) visit(child, child);
  }
}
visit(1, 1);

export function traceHld({ first, second, boxes }) {
  let u = first;
  let v = second;
  let total = 0;
  const processed = [];
  const colored = [];
  const value = vertex => vertex === 6 ? boxes : vertex;
  const columns = ["Величина", "Значение"];
  const frames = [{
    message: `Найдём сумму на пути из ${u} в ${v}. Тяжёлые рёбра выделены толстыми линиями. Цепь занимает соседние позиции в порядке DFS.`,
    graph: { current: [u, v], heavy: heavyEdges },
    table: {
      columns,
      rows: [["Порядок вершин", order.join(" · ")], ["Коробок в вершине 6", boxes]],
    },
  }];

  function addSegment(top, bottom, message, current) {
    const segment = order.slice(pos[top], pos[bottom] + 1);
    const values = segment.map(value);
    const part = values.reduce((sum, count) => sum + count, 0);
    total += part;
    processed.push(...segment);
    colored.push(...pathEdges(segment));
    frames.push({
      message,
      graph: { current, focus: [...processed], path: [...colored], heavy: heavyEdges },
      table: {
        caption: "Отрезок текущей цепи",
        columns,
        rows: [
          ["Позиции включительно", `[${pos[top]}, ${pos[bottom]}]`],
          ["Вершины отрезка", segment.join(" → ")],
          ["Сумма отрезка", `${values.join(" + ")} = ${part}`],
          ["Накопленная сумма", total],
        ],
        highlight: 3,
      },
    });
  }

  while (head[u] !== head[v]) {
    if (tree.depth[head[u]] < tree.depth[head[v]]) [u, v] = [v, u];
    const top = head[u];
    const next = tree.parent[top];
    addSegment(top, u, `Голова ${top} находится глубже или на той же глубине, что ${head[v]}. Снимаем отрезок от ${top} до ${u}. Продолжим из ${next}.`, [u, v]);
    u = next;
  }
  const [top, bottom] = pos[u] <= pos[v] ? [u, v] : [v, u];
  addSegment(top, bottom, `У ${u} и ${v} общая цепь с головой ${head[u]}. Добавляем последний отрезок, включая оба конца.`, [u, v]);
  const route = pathBetween(first, second);
  frames.push({
    message: `На пути из ${first} в ${second} всего коробок: ${total}.`,
    graph: { current: [first, second], focus: route, path: pathEdges(route), heavy: heavyEdges },
    table: { columns, rows: [["Путь", route.join(" → ")], ["Сумма", total]] },
  });
  return frames;
}

export function mount(marker) {
  return mountPlayer(marker, {
    label: "Запрос суммы по тяжёлым цепям",
    parameters: [
      { key: "first", title: "Начало пути", options: vertices, initial: 4 },
      { key: "second", title: "Конец пути", options: vertices, initial: 9 },
      { key: "boxes", title: "Коробок в вершине 6", options: [0, 6, 20, 50], initial: 6 },
    ],
    trace: traceHld,
  });
}
