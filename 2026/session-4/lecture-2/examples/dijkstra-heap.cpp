#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, s, t;
    cin >> n >> m >> s >> t;
    using Weight = long long;
    using Edge = pair<int, Weight>;  // {куда, вес}
    vector<vector<Edge>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        Weight w;
        cin >> u >> v >> w;
        g[u].push_back({v, w});
    }

    const Weight INF = 1LL << 62;
    vector<Weight> dist(n + 1, INF);
    vector<int> par(n + 1, -1);
    dist[s] = 0;

    using Entry = pair<Weight, int>;  // {расстояние, вершина}
    priority_queue<Entry, vector<Entry>, greater<Entry>> q;
    q.push({0, s});
    while (!q.empty()) {
        auto [d, v] = q.top();
        q.pop();
        if (d != dist[v]) continue;  // устаревшая запись
        if (v == t) break;

        for (auto [to, w] : g[v]) {
            Weight candidate = d + w;
            if (candidate < dist[to]) {
                dist[to] = candidate;
                par[to] = v;
                q.push({candidate, to});
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
