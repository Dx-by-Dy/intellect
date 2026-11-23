const demos = new Map([
  ["path-criteria", () => import("./path-criteria.js")],
  ["dijkstra", () => import("./dijkstra.js")],
  ["binary-heap", () => import("./binary-heap.js")],
]);
const mounted = new Map();

function initializeDemos() {
  for (const [root, disconnect] of mounted) {
    if (!root.isConnected) {
      disconnect();
      mounted.delete(root);
    }
  }

  for (const marker of document.querySelectorAll("[data-demo]")) {
    const load = demos.get(marker.dataset.demo);
    if (!load) continue;
    load().then(({ mount }) => {
      if (!marker.isConnected) return;
      const { root, disconnect } = mount(marker);
      mounted.set(root, disconnect);
    }).catch(error => console.error("Не удалось запустить демонстрацию", error));
  }
}

if (typeof document$ === "undefined") initializeDemos();
else document$.subscribe(initializeDemos);
