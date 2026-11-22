// informatics.msk.ru, задача 160 «Путь»
// Кратчайший путь по числу рёбер — это BFS. Чтобы вывести сам путь,
// запоминаем par[v] — из какой вершины мы впервые пришли в v.
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<vector<int>> a(n + 1, vector<int>(n + 1));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            cin >> a[i][j];
    int s, t;
    cin >> s >> t;

    vector<int> dist(n + 1, -1), par(n + 1, -1);
    queue<int> q;
    dist[s] = 0;
    q.push(s);
    while (!q.empty()) {
        int v = q.front();
        q.pop();
        for (int to = 1; to <= n; to++)
            if (a[v][to] == 1 && dist[to] == -1) {
                dist[to] = dist[v] + 1;
                par[to] = v;
                q.push(to);
            }
    }

    if (dist[t] == -1) {
        cout << -1 << '\n';
        return 0;
    }
    cout << dist[t] << '\n';
    if (dist[t] == 0) return 0;   // по условию путь длины 0 не выводим

    vector<int> path;
    for (int v = t; v != -1; v = par[v])
        path.push_back(v);
    reverse(path.begin(), path.end());
    for (int v : path) cout << v << ' ';
    cout << '\n';
}
