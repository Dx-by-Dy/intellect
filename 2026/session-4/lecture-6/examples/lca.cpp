#include <iostream>
#include <utility>
#include <vector>

using namespace std;

int climb(int v, int k, const vector<vector<int>>& up) {
    for (int j = 0; j < static_cast<int>(up.size()); ++j) {
        if ((k >> j) & 1) {
            v = up[j][v];
        }
    }
    return v;
}

int lca(int u, int v, const vector<int>& depth, const vector<vector<int>>& up) {
    if (depth[u] < depth[v]) {
        swap(u, v);
    }
    u = climb(u, depth[u] - depth[v], up);
    if (u == v) {
        return u;
    }

    for (int j = static_cast<int>(up.size()) - 1; j >= 0; --j) {
        if (up[j][u] != up[j][v]) {
            u = up[j][u];
            v = up[j][v];
        }
    }
    return up[0][u];
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

    int levels = 1;
    while ((1LL << levels) <= n) {
        ++levels;
    }
    vector<vector<int>> up(levels, vector<int>(n + 1));
    vector<int> depth(n + 1);
    vector<int> order{1};
    order.reserve(n);
    up[0][1] = 1;

    for (size_t i = 0; i < order.size(); ++i) {
        int v = order[i];
        for (int to : g[v]) {
            if (to != up[0][v]) {
                up[0][to] = v;
                depth[to] = depth[v] + 1;
                order.push_back(to);
            }
        }
    }
    for (int j = 1; j < levels; ++j) {
        for (int v = 1; v <= n; ++v) {
            up[j][v] = up[j - 1][up[j - 1][v]];
        }
    }

    for (int i = 0; i < q; ++i) {
        int u, v;
        cin >> u >> v;
        int ancestor = lca(u, v, depth, up);
        int distance = depth[u] + depth[v] - 2 * depth[ancestor];
        cout << ancestor << ' ' << distance << '\n';
    }
}
