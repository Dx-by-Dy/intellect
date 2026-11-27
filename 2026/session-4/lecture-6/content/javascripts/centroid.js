import { mountPlayer } from "./player.js";
import { pathBetween, pathEdges, rootTree, subtree, vertices } from "./tree.js";

const ancestors = Object.fromEntries(vertices.map(v => [v, []]));

function decompose(component, start) {
  const allowed = new Set(component);
  const rooted = rootTree(start, allowed);
  let centroid = start;
  for (;;) {
    const large = rooted.children[centroid].find(v => rooted.size[v] > component.length / 2);
    if (large === undefined) break;
    centroid = large;
  }
  const children = rootTree(centroid, allowed).children;
  const parts = children[centroid].map(v => subtree(v, children));
  const level = { centroid, component, parts };
  for (const v of component) ancestors[v].push(level);
  for (const part of parts) decompose(part, part[0]);
}
decompose(vertices, 1);

const distance = (a, b) => pathBetween(a, b).length - 1;
const format = value => Number.isFinite(value) ? value : "∞";

export function traceCentroid({ query, first, second }) {
  const marked = [...new Set([first, second].filter(Boolean))];
  const levels = ancestors[query];
  const chain = levels.map(level => level.centroid);
  const frames = [{
    message: `Сохраним цепочку центроидов для вершины ${query}. После выделения центроида продолжим в той компоненте, где осталась ${query}.`,
    graph: { current: [query] },
    table: { columns: ["Величина", "Значение"], rows: [["Вершина запроса", query], ["Размер дерева", vertices.length]] },
  }];

  for (const { centroid, component, parts } of levels) {
    const where = parts.find(part => part.includes(query));
    frames.push({
      message: where
        ? `Удаляем центроид ${centroid}. Вершина ${query} остаётся в компоненте из ${where.length} вершин.`
        : `Центроид ${centroid} совпал с вершиной запроса. Цепочка готова: ${chain.join(" → ")}.`,
      graph: { current: [centroid], focus: where || [query], muted: vertices.filter(v => !component.includes(v)) },
      table: {
        caption: `Компоненты после удаления ${centroid}`,
        columns: ["Размер", "Вершины"],
        rows: parts.length ? parts.map(part => [part.length, part.join(", ")]) : [[0, "—"]],
      },
    });
  }

  const best = new Map();
  const opened = [];
  const bestRows = () => chain.map(c => [c, format(best.get(c)?.length ?? Infinity), best.get(c)?.vertex ?? "—"]);
  for (const vertex of marked) {
    opened.push(vertex);
    for (const { centroid } of ancestors[vertex]) {
      const length = distance(centroid, vertex);
      if (length < (best.get(centroid)?.length ?? Infinity)) best.set(centroid, { length, vertex });
    }
    frames.push({
      message: `Открываем пункт ${vertex} и обновляем best у его центроидов. В таблице показаны значения для цепочки запроса.`,
      graph: { current: [vertex], marked: [...opened] },
      table: { columns: ["Центроид", "best", "Пункт"], rows: bestRows() },
    });
  }

  let answer = Infinity;
  let nearest = null;
  const checks = [];
  for (const c of chain) {
    const entry = best.get(c);
    const firstPart = distance(query, c);
    const secondPart = entry?.length ?? Infinity;
    const candidate = firstPart + secondPart;
    if (candidate < answer) {
      answer = candidate;
      nearest = entry.vertex;
    }
    checks.push([c, firstPart, format(secondPart), format(candidate), format(answer)]);
    const route = entry ? [...pathBetween(query, c), ...pathBetween(c, entry.vertex).slice(1)] : pathBetween(query, c);
    frames.push({
      message: entry
        ? `Через центроид ${c}: ${firstPart} + ${secondPart} = ${candidate}. Текущий минимум: ${answer}.`
        : `У центроида ${c} пока best = ∞. Текущий минимум остаётся ${format(answer)}.`,
      graph: { current: [c], marked, focus: route, path: pathEdges(route) },
      table: {
        columns: ["Центроид", "До него", "best", "Сумма", "Минимум"],
        rows: [...checks],
        highlight: checks.length - 1,
      },
    });
  }

  const route = nearest === null ? [] : pathBetween(query, nearest);
  frames.push({
    message: nearest === null
      ? "Открытых пунктов нет. Ответ — −1."
      : `Ближайший открытый пункт к ${query} — ${nearest}. Расстояние — ${answer}.`,
    graph: { current: [query], marked, focus: route, path: pathEdges(route) },
    table: {
      columns: ["Величина", "Ответ"],
      rows: [["Пункт", nearest ?? "—"], ["Расстояние", nearest === null ? -1 : answer]],
    },
  });
  return frames;
}

export function mount(marker) {
  const pointOptions = [[0, "Закрыт"], ...vertices];
  return mountPlayer(marker, {
    label: "Запрос по центроидной декомпозиции",
    parameters: [
      { key: "query", title: "Вершина запроса", options: vertices, initial: 9 },
      { key: "first", title: "Первый пункт", options: pointOptions, initial: 7 },
      { key: "second", title: "Второй пункт", options: pointOptions, initial: 0 },
    ],
    trace: traceCentroid,
  });
}
