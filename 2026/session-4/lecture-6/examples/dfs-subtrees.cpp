#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, root;
    cin >> n >> root;
    vector<vector<int>> g(n + 1);
    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }

    vector<int> parent(n + 1), depth(n + 1), tin(n + 1);
    vector<int> size(n + 1, 1), order;
    vector<int> pending{root};
    order.reserve(n);

    while (!pending.empty()) {
        int v = pending.back();
        pending.pop_back();
        tin[v] = static_cast<int>(order.size());
        order.push_back(v);

        // Reverse the insertion order so the first neighbor is processed first.
        for (auto it = g[v].rbegin(); it != g[v].rend(); ++it) {
            int to = *it;
            if (to == parent[v]) {
                continue;
            }
            parent[to] = v;
            depth[to] = depth[v] + 1;
            pending.push_back(to);
        }
    }

    for (auto it = order.rbegin(); it != order.rend(); ++it) {
        int v = *it;
        if (v != root) {
            size[parent[v]] += size[v];
        }
    }

    for (int v = 1; v <= n; ++v) {
        int tout = tin[v] + size[v];
        cout << v << ' ' << parent[v] << ' ' << depth[v] << ' '
             << size[v] << ' ' << tin[v] << ' ' << tout << '\n';
    }
}
