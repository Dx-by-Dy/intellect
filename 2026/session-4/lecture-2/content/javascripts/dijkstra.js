import { drawGraph, formatDistance, mainGraph, observeGraph, restoreEdges, traceDijkstra } from "./graph.js";

export function mount(marker) {
  const root = document.createElement("div");
  root.className = "lecture-demo";
  root.tabIndex = 0;
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", "Пошаговый разбор алгоритма Дейкстры");
  root.innerHTML = `
    <div class="demo-controls">
      <button type="button" data-action="reset">⟲ Сначала</button>
      <button type="button" data-action="prev">◀ Назад</button>
      <button type="button" class="demo-primary" data-action="next">Шаг ▶</button>
      <span class="demo-count"></span>
    </div>
    <p class="demo-message" aria-live="polite"></p>
    <div class="demo-board">
      <div class="demo-panel">
        <div class="demo-panel-title">Граф из S в T · 8 вершин, 13 дуг</div>
        <svg class="graph" role="img" aria-label="Граф Дейкстры"></svg>
        <div class="demo-legend">
          <span><i class="dot" aria-hidden="true"></i>ещё не найдена</span>
          <span><i class="dot open" aria-hidden="true"></i>оценка найдена</span>
          <span><i class="dot current" aria-hidden="true"></i>выбрана</span>
          <span><i class="dot done" aria-hidden="true"></i>расстояние зафиксировано</span>
          <span><i class="line-key" aria-hidden="true"></i>проверяем дугу</span>
          <span><i class="line-key path" aria-hidden="true"></i>кратчайший путь</span>
        </div>
      </div>
      <div class="demo-side">
        <div class="demo-panel">
          <div class="demo-panel-title">Текущие оценки и предшественники</div>
          <table class="demo-state" aria-label="Массивы dist и par"></table>
        </div>
        <div class="demo-panel">
          <div class="demo-panel-title">Проверка исходящих дуг</div>
          <div class="demo-relaxations"></div>
        </div>
      </div>
    </div>
    <p class="demo-hint">Один шаг выбирает вершину и проверяет её исходящие дуги. Когда фокус на демонстрации, шаги можно листать клавишами ← и →.</p>`;

  const svg = root.querySelector("svg");
  const message = root.querySelector(".demo-message");
  const count = root.querySelector(".demo-count");
  const table = root.querySelector(".demo-state");
  const relaxations = root.querySelector(".demo-relaxations");
  const previousButton = root.querySelector('[data-action="prev"]');
  const nextButton = root.querySelector('[data-action="next"]');
  const vertices = Object.keys(mainGraph.position);
  const frames = traceDijkstra(mainGraph, "S");
  const lastStep = frames.length;
  const finalFrame = { ...frames.at(-1), chosen: null, checks: [] };
  const pathEdges = restoreEdges(finalFrame.par, "T");
  const path = new Set(pathEdges);
  const route = ["S", ...pathEdges.map(([, to]) => to)];
  let step = 0;

  const currentFrame = () => step === lastStep ? finalFrame : frames[step];

  function redraw() {
    const frame = currentFrame();
    drawGraph(svg, mainGraph, {
      frame,
      active: new Set(frame.checks.map(check => check.edge)),
      path: step === lastStep ? path : undefined,
    });
  }

  function render() {
    const { chosen, dist, par, checks } = currentFrame();
    const changed = new Set(checks.filter(check => check.improved).map(check => check.edge[1]));
    const cellClass = v => v === chosen ? "current" : changed.has(v) ? "changed" : "";
    const columns = vertices.map(v => `<th scope="col" class="${cellClass(v)}">${v}</th>`).join("");
    const cells = values => vertices.map(v => `<td class="${cellClass(v)}">${values(v)}</td>`).join("");
    table.innerHTML = `
      <thead><tr><th scope="col">v</th>${columns}</tr></thead>
      <tbody>
        <tr><th scope="row">dist</th>${cells(v => formatDistance(dist[v]))}</tr>
        <tr><th scope="row">par</th>${cells(v => par[v]?.[0] ?? "—")}</tr>
      </tbody>`;

    if (step === 0) {
      message.textContent = "Начинаем из S. Её оценка равна 0, для остальных вершин ставим ∞.";
    } else if (step === lastStep) {
      message.textContent = `Кратчайший путь ${route.join(" → ")} весит ${dist.T}. До U пути из S нет.`;
    } else if (chosen === "T") {
      message.textContent = `Выбрали T с оценкой ${dist.T}. Если нужен путь только до T, уже можно остановиться.`;
    } else {
      message.textContent = `Выбрали ${chosen} с минимальной оценкой ${dist[chosen]}. Это расстояние уже точное.`;
    }

    if (checks.length) {
      const items = checks.map(({ edge, candidate, previous, improved }) => {
        const [from, to, weight] = edge;
        const before = formatDistance(previous);
        const result = improved
          ? `<strong>${before} → ${candidate}</strong>`
          : `оставляем ${before}`;
        return `<li><code>${from} → ${to}</code> · ${dist[from]} + ${weight} = ${candidate}, ${result}</li>`;
      }).join("");
      relaxations.innerHTML = `<ul>${items}</ul>`;
    } else {
      relaxations.textContent = step === 0 ? "Сначала выберем стартовую вершину."
        : step === lastStep ? "Необработанных вершин с конечной оценкой больше нет."
        : `Из ${chosen} не выходит ни одной дуги.`;
    }

    count.textContent = `шаг ${step} из ${lastStep}`;
    previousButton.setAttribute("aria-disabled", String(step === 0));
    nextButton.setAttribute("aria-disabled", String(step === lastStep));
    redraw();
  }

  function goTo(index) {
    const next = Math.max(0, Math.min(lastStep, index));
    if (step === next) return;
    step = next;
    render();
  }

  previousButton.addEventListener("click", () => goTo(step - 1));
  nextButton.addEventListener("click", () => goTo(step + 1));
  root.querySelector('[data-action="reset"]').addEventListener("click", () => goTo(0));
  root.addEventListener("keydown", event => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    goTo(step + (event.key === "ArrowLeft" ? -1 : 1));
  });

  marker.replaceWith(root);
  const disconnect = observeGraph(svg, redraw);
  render();
  return { root, disconnect };
}
