import { mountPlayer } from "./player.js";
import { tree } from "./tree.js";

function keepLarger(row, distance, chosen) {
  if (row[distance] === null || chosen.length > row[distance].length) row[distance] = chosen;
}

function largest(row) {
  return row.reduce((best, chosen) => chosen && chosen.length > best.length ? chosen : best, []);
}

export function tracePacking({ distance }) {
  const columns = ["Состояние", ...Array.from({ length: distance + 1 }, (_, d) => d === distance ? `≥ ${d}` : d)];
  const row = (label, chosen) => [label, ...chosen.map(set => set === null ? "—" : set.length)];
  const blank = () => Array(distance + 1).fill(null);
  const single = blank();
  const empty = blank();
  single[0] = [1];
  empty[distance] = [];
  const frames = [{
    message: `При D = ${distance} обходим дерево от детей к родителю. Ячейка показывает размер набора для данного ближайшего расстояния.`,
    graph: {},
    table: {
      caption: "Начальные состояния одной вершины",
      columns,
      rows: [row("Взять", single), row("Пропустить", empty)],
    },
  }];
  const dp = {};
  for (const v of [...tree.order].reverse()) {
    let current = blank();
    current[0] = [v];
    current[distance] = [];
    if (tree.children[v].length === 0) {
      frames.push({
        message: `Вершина ${v} — лист. Можно взять её или оставить набор пустым.`,
        graph: { current: [v] },
        table: { caption: `Состояния вершины ${v}`, columns, rows: [row("Размер", current)] },
      });
    }
    for (const child of tree.children[v]) {
      const shifted = blank();
      for (const [d, chosen] of dp[child].entries()) {
        if (chosen !== null) keepLarger(shifted, Math.min(distance, d + 1), chosen);
      }
      const next = blank();
      const pairs = blank();
      for (const [a, left] of current.entries()) {
        if (left === null) continue;
        for (const [b, right] of shifted.entries()) {
          if (right === null || a + b < distance) continue;
          const d = Math.min(a, b);
          if (next[d] === null || left.length + right.length > next[d].length) {
            next[d] = [...left, ...right];
            pairs[d] = [a, b];
          }
        }
      }
      const best = largest(next);
      const d = next.indexOf(best);
      const [a, b] = pairs[d];
      const nearest = d === distance ? `не меньше ${d}` : d;
      frames.push({
        message: `Добавляем ветвь ${child} к вершине ${v}. Для выделенного набора a + b = ${a} + ${b} ≥ ${distance}, ближайшее расстояние — ${nearest}. Размер набора — ${best.length}.`,
        graph: { current: [v, child], focus: best },
        table: {
          caption: `Расстояния отсчитываются от ${v}`,
          columns,
          rows: [row("A · было", current), row(`B · ветвь ${child}`, shifted), row("Стало", next)],
          highlight: 2,
        },
      });
      current = next;
    }
    dp[v] = current;
  }

  const best = largest(dp[1]);
  frames.push({
    message: `При D = ${distance} максимум — ${best.length}. Один подходящий набор: ${[...best].sort((a, b) => a - b).join(", ")}.`,
    graph: { focus: best },
    table: { caption: "Состояния корня 1", columns, rows: [row("Размер", dp[1])] },
  });
  return frames;
}

export function mount(marker) {
  return mountPlayer(marker, {
    label: "Динамика по поддеревьям по шагам",
    parameters: [{ key: "distance", title: "Минимальное расстояние D", options: [1, 2, 3, 4, 5, 6, 7], initial: 3 }],
    trace: tracePacking,
  });
}
