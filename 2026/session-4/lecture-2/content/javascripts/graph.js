/* Графы и визуализация для обеих демонстраций. */
export const smallGraph = {
  position: { S: [0, 86], A: [0.34, 26], B: [0.66, 26], T: [1, 86], U: [0, 149] },
  edges: [
    ["S", "T", 10], ["S", "A", 2], ["S", "B", 6],
    ["A", "B", 1], ["B", "T", 2], ["U", "S", 1],
  ],
};
export const mainGraph = {
  position: {
    S: [0, 118], A: [0.25, 28], B: [0.25, 207], C: [0.5, 118],
    D: [0.75, 28], E: [0.75, 207], T: [1, 118], U: [0.5, 281],
  },
  edges: [
    ["S", "A", 7], ["S", "B", 2], ["S", "C", 12],
    ["B", "C", 4], ["B", "E", 12],
    ["C", "A", 0], ["C", "D", 6], ["C", "E", 1],
    ["A", "D", 2], ["E", "T", 8],
    ["D", "E", 3], ["D", "T", 1], ["U", "E", 1],
  ],
};

function adjacencyLists(graph) {
  const adjacency = Object.fromEntries(Object.keys(graph.position).map(v => [v, []]));
  for (const edge of graph.edges) adjacency[edge[0]].push(edge);
  return adjacency;
}

export function traceDijkstra(graph, start, weightOf = edge => edge[2]) {
  const adjacency = adjacencyLists(graph);
  const vertices = Object.keys(adjacency);
  const dist = Object.fromEntries(vertices.map(v => [v, Infinity]));
  const par = {};
  const settled = new Set();
  const frames = [];
  dist[start] = 0;

  function record(chosen, checks) {
    frames.push({ chosen, checks, dist: { ...dist }, par: { ...par }, settled: new Set(settled) });
  }
  record(null, []);

  while (settled.size < vertices.length) {
    let chosen = null;
    let minimum = Infinity;
    for (const v of vertices) {
      if (!settled.has(v) && dist[v] < minimum) {
        chosen = v;
        minimum = dist[v];
      }
    }
    if (chosen === null) break;
    settled.add(chosen);

    const checks = [];
    for (const edge of adjacency[chosen]) {
      const to = edge[1];
      const candidate = minimum + weightOf(edge);
      const previous = dist[to];
      const improved = candidate < previous;
      if (improved) {
        dist[to] = candidate;
        par[to] = edge;
      }
      checks.push({ edge, candidate, previous, improved });
    }
    record(chosen, checks);
  }
  return frames;
}

export function restoreEdges(par, target) {
  const path = [];
  for (let v = target; par[v]; v = par[v][0]) path.push(par[v]);
  return path.reverse();
}

export const formatDistance = d => d === Infinity ? "∞" : String(d);

let graphCount = 0;

export function observeGraph(svg, redraw) {
  svg.id = `lecture-graph-${++graphCount}`;
  const observer = new ResizeObserver(redraw);
  observer.observe(svg);
  return () => observer.disconnect();
}

export function drawGraph(svg, graph, { frame, active = new Set(), path = new Set() }) {
  const width = svg.clientWidth;
  if (!width) return;
  const height = svg.clientHeight;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const vertexRadius = frame ? 19 : 16;
  const margin = vertexRadius + 5;
  const position = Object.fromEntries(Object.entries(graph.position).map(([v, [fraction, y]]) =>
    [v, [margin + fraction * (width - 2 * margin), y]]));

  const markerId = kind => `${svg.id}-${kind}`;
  const markers = ["normal", "active", "path"].map(kind =>
    `<marker id="${markerId(kind)}" markerWidth="9" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path class="arrow ${kind}" d="M0 0 L9 5 L0 10 Z"/></marker>`).join("");

  const lines = [];
  const weights = [];
  for (const edge of graph.edges) {
    const [from, to, weight] = edge;
    const [x1, y1] = position[from];
    const [x2, y2] = position[to];
    const length = Math.hypot(x2 - x1, y2 - y1);
    const dx = (x2 - x1) / length;
    const dy = (y2 - y1) / length;
    const kind = path.has(edge) ? "path" : active.has(edge) ? "active" : "normal";
    const startOffset = vertexRadius + 2;
    const endOffset = vertexRadius + 5;
    lines.push(`<line class="edge ${kind}" x1="${x1 + startOffset * dx}" y1="${y1 + startOffset * dy}" x2="${x2 - endOffset * dx}" y2="${y2 - endOffset * dy}" marker-end="url(#${markerId(kind)})"/>`);
    weights.push(`<text class="weight" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2}">${weight}</text>`);
  }

  const nodes = [];
  const estimates = [];
  for (const [v, [x, y]] of Object.entries(position)) {
    let state = "";
    let distanceLabel = "";
    if (frame) {
      if (v === frame.chosen) state = "current";
      else if (frame.settled.has(v)) state = "done";
      else if (frame.dist[v] !== Infinity) state = "open";
      const estimate = formatDistance(frame.dist[v]);
      distanceLabel = `<text class="estimate" y="8">${estimate}</text>`;
      estimates.push(`${v} — ${estimate}`);
    }
    nodes.push(`<g class="vertex ${state}" data-vertex="${v}" transform="translate(${x} ${y})"><circle r="${vertexRadius}"/><text y="${frame ? -6 : 0}">${v}</text>${distanceLabel}</g>`);
  }
  const edgesText = graph.edges.map(([u, v, w]) => `${u} → ${v}, вес ${w}`).join("; ");
  const estimatesText = estimates.length ? ` Оценки из S. ${estimates.join("; ")}.` : "";
  svg.setAttribute("aria-label", `Ориентированный граф.${estimatesText} Дуги. ${edgesText}.`);
  svg.innerHTML = `<defs>${markers}</defs>${lines.join("")}${weights.join("")}${nodes.join("")}`;
}
