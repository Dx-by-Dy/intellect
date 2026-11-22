// CSES 1667 «Message Route»
// То же, что «Путь», но n <= 10^5, m <= 2*10^5: вместо матрицы — списки смежности.
// BFS из 1, путь до n восстанавливаем по par. Ответ — число вершин в пути и сам путь.
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    vector<vector<int>> g(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }

    vector<int> dist(n + 1, -1), par(n + 1, -1);
    queue<int> q;
    dist[1] = 0;
    q.push(1);
    while (!q.empty()) {
        int v = q.front();
        q.pop();
        for (int to : g[v])
            if (dist[to] == -1) {
                dist[to] = dist[v] + 1;
                par[to] = v;
                q.push(to);
            }
    }

    if (dist[n] == -1) {
        cout << "IMPOSSIBLE\n";
        return 0;
    }
    vector<int> path;
    for (int v = n; v != -1; v = par[v])
        path.push_back(v);
    reverse(path.begin(), path.end());
    cout << path.size() << '\n';
    for (int v : path) cout << v << ' ';
    cout << '\n';
}
