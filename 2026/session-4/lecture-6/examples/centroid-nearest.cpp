#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

using namespace std;

struct Visit {
    int vertex;
    int parent;
    int distance;
};

vector<vector<pair<int, int>>> centroid_paths(const vector<vector<int>>& g) {
    vector<vector<pair<int, int>>> paths(g.size());
    vector<int> parent(g.size()), size(g.size());
    vector<bool> removed(g.size());
    vector<int> pending{1}, component;
    vector<Visit> walk;

    while (!pending.empty()) {
        int start = pending.back();
        pending.pop_back();
        component.clear();
        component.push_back(start);
        parent[start] = 0;
        for (size_t i = 0; i < component.size(); ++i) {
            int v = component[i];
            size[v] = 1;
            for (int to : g[v]) {
                if (!removed[to] && to != parent[v]) {
                    parent[to] = v;
                    component.push_back(to);
                }
            }
        }
        for (auto it = component.rbegin(); it != component.rend(); ++it) {
            int v = *it;
            if (v != start) {
                size[parent[v]] += size[v];
            }
        }

        int count = static_cast<int>(component.size());
        int centroid = start;
        while (true) {
            int next = 0;
            for (int to : g[centroid]) {
                if (!removed[to] && to != parent[centroid] && size[to] > count / 2) {
                    next = to;
                    break;
                }
            }
            if (next == 0) {
                break;
            }
            centroid = next;
        }
        removed[centroid] = true;

        walk.push_back({centroid, 0, 0});
        while (!walk.empty()) {
            auto [v, p, dist] = walk.back();
            walk.pop_back();
            paths[v].push_back({centroid, dist});
            for (int to : g[v]) {
                if (!removed[to] && to != p) {
                    walk.push_back({to, v, dist + 1});
                }
            }
        }
        for (int to : g[centroid]) {
            if (!removed[to]) {
                pending.push_back(to);
            }
        }
    }
    return paths;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    cin >> n >> q;
    vector<vector<int>> g(n + 1);
    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    auto paths = centroid_paths(g);

    const int infinity = 2 * n;
    vector<int> best(n + 1, infinity);
    for (int i = 0; i < q; ++i) {
        int type, v;
        cin >> type >> v;
        if (type == 1) {
            for (auto [centroid, dist] : paths[v]) {
                best[centroid] = min(best[centroid], dist);
            }
        } else {
            int answer = infinity;
            for (auto [centroid, dist] : paths[v]) {
                answer = min(answer, dist + best[centroid]);
            }
            cout << (answer == infinity ? -1 : answer) << '\n';
        }
    }
}
