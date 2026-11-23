#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, s, t;
    cin >> n >> m >> s >> t;
    // --8<-- [start:read-graph]
    using Weight = long long;
    using Edge = pair<int, Weight>;  // {куда, вес}
    vector<vector<Edge>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        Weight w;
        cin >> u >> v >> w;
        g[u].push_back({v, w});
    }
    // --8<-- [end:read-graph]

    const Weight INF = 1LL << 62;
    vector<Weight> dist(n + 1, INF);
    vector<int> par(n + 1, -1);
    dist[s] = 0;

    vector<bool> used(n + 1, false);
    for (int step = 0; step < n; step++) {
        int v = -1;
        for (int u = 1; u <= n; u++)
            if (!used[u] && (v == -1 || dist[u] < dist[v]))
                v = u;
        if (v == -1 || dist[v] == INF) break;
        used[v] = true;
        if (v == t) break;

        for (auto [to, w] : g[v]) {
            Weight candidate = dist[v] + w;
            if (candidate < dist[to]) {
                dist[to] = candidate;
                par[to] = v;
            }
        }
    }

    if (dist[t] == INF) {
        cout << -1 << '\n';
        return 0;
    }
    vector<int> path;
    for (int v = t; v != -1; v = par[v])
        path.push_back(v);
    reverse(path.begin(), path.end());

    cout << dist[t] << '\n';
    for (int v : path) cout << v << ' ';
    cout << '\n';
}
