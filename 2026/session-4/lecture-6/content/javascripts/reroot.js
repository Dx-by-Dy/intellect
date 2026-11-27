import { mountPlayer } from "./player.js";
import { edgeKey, pathBetween, pathEdges, subtree, tree, vertices } from "./tree.js";

export function traceReroot({ target }) {
  const n = vertices.length;
  const route = pathBetween(1, target);
  let sum = vertices.reduce((total, v) => total + tree.depth[v], 0);
  const frames = [{
    message: `От корня 1 до каждой вершины расстояние равно её глубине. Складываем глубины и получаем ${sum}.`,
    graph: { current: [1] },
    table: {
      columns: ["Вершины", ...vertices],
      rows: [["Глубины", ...vertices.map(v => tree.depth[v])]],
    },
  }];
  for (const [index, to] of route.slice(1).entries()) {
    const from = route[index];
    const closer = subtree(to);
    const farther = vertices.filter(v => !closer.includes(v));
    const next = sum + n - 2 * closer.length;
    frames.push({
      message: `Переносим корень из ${from} в ${to}. До выделенных синим ${closer.length} вершин на одно ребро ближе, до остальных — на одно дальше.`,
      graph: { current: [from, to], focus: closer, muted: farther, cut: edgeKey(from, to) },
      table: {
        caption: `Разрез ребра ${from}–${to}`,
        columns: ["Изменение", "Вершины или расчёт"],
        rows: [
          ["На 1 ближе", closer.join(", ")],
          ["На 1 дальше", farther.join(", ")],
          ["Новая сумма", `${sum} + ${n} − 2 · ${closer.length} = ${next}`],
        ],
        highlight: 2,
      },
    });
    sum = next;
  }
  frames.push({
    message: `Сумма расстояний из вершины ${target} равна ${sum}.`,
    graph: { current: [target], focus: route, path: pathEdges(route) },
    table: {
      columns: ["Величина", "Ответ"],
      rows: [["Перенос корня", route.join(" → ")], ["Сумма расстояний", sum]],
    },
  });
  return frames;
}

export function mount(marker) {
  return mountPlayer(marker, {
    label: "Смена корня по шагам",
    parameters: [{ key: "target", title: "Новый корень", options: vertices, initial: 9 }],
    trace: traceReroot,
  });
}
