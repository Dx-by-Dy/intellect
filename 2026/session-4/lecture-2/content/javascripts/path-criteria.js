import { drawGraph, observeGraph, restoreEdges, smallGraph, traceDijkstra } from "./graph.js";

export function mount(marker) {
  const root = document.createElement("div");
  root.className = "lecture-demo demo-panel";
  root.innerHTML = `
    <div class="demo-controls" role="group" aria-label="Критерий выбора пути">
      <button type="button" data-criterion="edges" aria-pressed="true">Меньше рёбер</button>
      <button type="button" data-criterion="weight" aria-pressed="false">Меньше минут</button>
    </div>
    <svg class="graph compact" role="img" aria-label="Маршруты от S до T"></svg>
    <p class="demo-message" aria-live="polite"></p>`;
  const svg = root.querySelector("svg");
  const result = root.querySelector(".demo-message");
  const buttons = [...root.querySelectorAll("[data-criterion]")];
  const byEdges = traceDijkstra(smallGraph, "S", () => 1).at(-1);
  const byWeight = traceDijkstra(smallGraph, "S").at(-1);
  let selected = buttons[0];

  function render() {
    const { par } = selected.dataset.criterion === "edges" ? byEdges : byWeight;
    const path = restoreEdges(par, "T");
    const route = ["S", ...path.map(edge => edge[1])];
    const time = path.reduce((sum, edge) => sum + edge[2], 0);
    buttons.forEach(button => button.setAttribute("aria-pressed", String(selected === button)));
    result.textContent = `${route.join(" → ")} · ${path.length} ${path.length === 1 ? "ребро" : "ребра"} · ${time} минут`;
    drawGraph(svg, smallGraph, { path: new Set(path) });
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      selected = button;
      render();
    });
  }

  marker.replaceWith(root);
  const disconnect = observeGraph(svg, render);
  render();
  return { root, disconnect };
}
