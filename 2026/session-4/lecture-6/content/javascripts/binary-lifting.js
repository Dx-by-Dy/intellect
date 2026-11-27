import { mountPlayer } from "./player.js";
import { pathBetween, pathEdges, tree, vertices } from "./tree.js";

const up = [Object.fromEntries(vertices.map(v => [v, tree.parent[v] || v]))];
for (let jump = 2; jump <= vertices.length; jump *= 2) {
  const previous = up.at(-1);
  up.push(Object.fromEntries(vertices.map(v => [v, previous[previous[v]]])));
}

function jumpTable(u, v, highlight) {
  return {
    caption: `Прыжки из ${u} и ${v}`,
    columns: ["Рёбер", `Из ${u}`, `Из ${v}`],
    rows: up.map((row, j) => [2 ** j, row[u], row[v]]),
    highlight,
  };
}

export function traceLca({ first, second }) {
  let u = first;
  let v = second;
  if (tree.depth[u] < tree.depth[v]) [u, v] = [v, u];
  const delta = tree.depth[u] - tree.depth[v];
  const frames = [{
    message: delta
      ? `У вершины ${u} глубина ${tree.depth[u]}, у ${v} — ${tree.depth[v]}. Поднимем ${u} на ${delta}, чтобы сравнять глубины.`
      : `Обе вершины на глубине ${tree.depth[u]}. Можно сразу сравнивать их предков.`,
    graph: { current: [u, v] },
    table: jumpTable(u, v),
  }];
  for (const [j, row] of up.entries()) {
    const jump = 2 ** j;
    if (!(delta & jump)) continue;
    const next = row[u];
    frames.push({
      message: `В разности глубин есть слагаемое ${jump}. Прыгаем из ${u} в ${next}.`,
      graph: { current: [u, v], focus: [next], path: pathEdges(pathBetween(u, next)) },
      table: jumpTable(u, v, j),
    });
    u = next;
  }

  if (u !== v) {
    for (let j = up.length - 1; j >= 0; j--) {
      const a = up[j][u];
      const b = up[j][v];
      const jump = 2 ** j;
      const same = a === b;
      frames.push({
        message: same
          ? `Прыжок на ${jump}: обе вершины попали бы в ${a}. Пропускаем этот прыжок.`
          : `Прыжок на ${jump}: получаем разные вершины ${a} и ${b}. Поднимаем обе.`,
        graph: {
          current: [u, v], focus: [a, b],
          path: same ? [] : [...pathEdges(pathBetween(u, a)), ...pathEdges(pathBetween(v, b))],
        },
        table: jumpTable(u, v, j),
      });
      if (!same) [u, v] = [a, b];
    }
  }

  const answer = u === v ? u : up[0][u];
  const route = pathBetween(first, second);
  frames.push({
    message: u === v
      ? `После выравнивания вершины совпали. Общий предок — ${answer}, расстояние между исходными вершинами — ${route.length - 1}.`
      : `Вершины ${u} и ${v} стоят под общим родителем ${answer}. Это LCA. Расстояние между исходными вершинами — ${route.length - 1}.`,
    graph: { current: [answer], focus: route, path: pathEdges(route) },
    table: {
      columns: ["Величина", "Ответ"],
      rows: [["LCA", answer], ["Путь", route.join(" → ")], ["Длина пути", route.length - 1]],
    },
  });
  return frames;
}

export function mount(marker) {
  return mountPlayer(marker, {
    label: "Двоичные подъёмы по шагам",
    parameters: [
      { key: "first", title: "Первая вершина", options: vertices, initial: 4 },
      { key: "second", title: "Вторая вершина", options: vertices, initial: 9 },
    ],
    trace: traceLca,
  });
}
