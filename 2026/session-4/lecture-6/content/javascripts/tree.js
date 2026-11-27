const response = await fetch(new URL("./tree-edges.txt", import.meta.url));
if (!response.ok) throw new Error(`Рёбра дерева недоступны (HTTP ${response.status})`);

export const edges = (await response.text()).trim().split("\n")
  .map(line => line.trim().split(/\s+/).map(Number));
export const vertices = [...new Set(edges.flat())].sort((a, b) => a - b);
const neighbors = Object.fromEntries(vertices.map(v => [v, []]));
for (const [a, b] of edges) {
  neighbors[a].push(b);
  neighbors[b].push(a);
}

export function rootTree(root, component = new Set(vertices)) {
  const order = [root];
  const parent = { [root]: 0 };
  const depth = { [root]: 0 };
  const children = {};
  const size = {};
  for (const v of order) {
    children[v] = neighbors[v].filter(to => to !== parent[v] && component.has(to));
    size[v] = 1;
    for (const to of children[v]) {
      parent[to] = v;
      depth[to] = depth[v] + 1;
      order.push(to);
    }
  }
  for (const v of order.slice(1).reverse()) size[parent[v]] += size[v];
  return { order, parent, depth, children, size };
}

export const tree = rootTree(1);

export function subtree(root, children = tree.children) {
  const order = [root];
  for (const v of order) order.push(...children[v]);
  return order;
}

export function pathBetween(a, b) {
  const start = [];
  const end = [];
  while (a !== b) {
    if (tree.depth[a] >= tree.depth[b]) {
      start.push(a);
      a = tree.parent[a];
    } else {
      end.push(b);
      b = tree.parent[b];
    }
  }
  return [...start, a, ...end.reverse()];
}

export function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function pathEdges(path) {
  return path.slice(1).map((v, i) => edgeKey(path[i], v));
}

const positions = {
  1: [215, 27],
  2: [95, 78], 3: [325, 78],
  4: [45, 130], 5: [145, 130], 6: [325, 130],
  7: [230, 182], 8: [325, 182], 10: [420, 182],
  9: [325, 234],
};
const edgeDescription = edges.map(([a, b]) => `${a}–${b}`).join(", ");
const width = 480;
const height = 262;

export function drawTree(canvas, graph = {}) {
  const {
    current = [], focus = [], marked = [], muted = [], path = [], heavy = [], cut = null,
  } = graph;
  const styles = getComputedStyle(canvas);
  const color = name => styles.getPropertyValue(`--tree-${name}`).trim();
  const ctx = canvas.getContext("2d");
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";

  for (const [a, b] of edges) {
    const key = edgeKey(a, b);
    const onPath = path.includes(key);
    const isCut = cut === key;
    const faded = muted.includes(a) || muted.includes(b);
    ctx.strokeStyle = color(isCut ? "current" : onPath ? "active" : faded ? "faded" : "edge");
    ctx.lineWidth = onPath ? 5 : heavy.includes(key) && !faded ? 4 : 2;
    ctx.setLineDash(isCut ? [6, 5] : []);
    ctx.beginPath();
    ctx.moveTo(...positions[a]);
    ctx.lineTo(...positions[b]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  function circle(x, y, radius, fill, stroke, lineWidth) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    if (fill) {
      ctx.fillStyle = color(fill);
      ctx.fill();
    }
    ctx.strokeStyle = color(stroke);
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  ctx.font = "600 19px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const v of vertices) {
    const [x, y] = positions[v];
    const active = focus.includes(v);
    const faded = muted.includes(v);
    const open = marked.includes(v);
    const isCurrent = current.includes(v);
    const stroke = open ? "marked" : active ? "active" : faded ? "faded" : "edge";
    circle(x, y, 17, active ? "active-bg" : "surface", stroke, open || active ? 3 : 2);
    if (isCurrent) circle(x, y, 21, null, "current", 3);
    ctx.fillStyle = color(faded && !open ? "muted-ink" : "ink");
    ctx.fillText(v, x, y + 0.6);
  }

  const descriptions = [
    `Дерево. Рёбра ${edgeDescription}.`,
    current.length ? `Текущие вершины ${current.join(", ")}.` : "",
    focus.length ? `Подсвечены вершины ${focus.join(", ")}.` : "",
    marked.length ? `Открытые пункты ${marked.join(", ")}.` : "",
    cut ? `Разрез по ребру ${cut}.` : "",
  ].filter(Boolean);
  canvas.setAttribute("aria-label", descriptions.join(" "));
}
