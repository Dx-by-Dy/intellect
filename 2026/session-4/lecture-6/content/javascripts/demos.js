const demos = new Map([
  ["tree-dp", () => import("./tree-dp.js")],
  ["binary-lifting", () => import("./binary-lifting.js")],
  ["reroot", () => import("./reroot.js")],
  ["hld", () => import("./hld.js")],
  ["centroid", () => import("./centroid.js")],
]);

const mounted = new Map();
const loading = new WeakSet();

function initializeDemos() {
  for (const [root, disconnect] of mounted) {
    if (!root.isConnected) {
      disconnect();
      mounted.delete(root);
    }
  }
  for (const marker of document.querySelectorAll("[data-demo]")) {
    const load = demos.get(marker.dataset.demo);
    if (!load || loading.has(marker)) continue;
    loading.add(marker);
    load().then(({ mount }) => {
      if (!marker.isConnected) return;
      const { root, disconnect } = mount(marker);
      mounted.set(root, disconnect);
    }).catch(error => console.error("Не удалось запустить демонстрацию", error))
      .finally(() => loading.delete(marker));
  }
}

if (typeof document$ === "undefined") initializeDemos();
else document$.subscribe(initializeDemos);
