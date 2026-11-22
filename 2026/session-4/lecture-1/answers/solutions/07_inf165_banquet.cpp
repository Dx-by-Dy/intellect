// informatics.msk.ru, задача 165 «Банкет»
// Вершины — гости, рёбра — пары, которые нельзя сажать вместе.
// Нужно покрасить граф в 2 цвета так, чтобы концы каждого ребра были разного цвета
// (проверка на двудольность). Красим DFS-ом; граф может быть несвязным.
#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> g;
vector<int> color;   // 0 — ещё не покрашен, 1 или 2 — номер стола
bool ok = true;

void dfs(int v, int c) {
    color[v] = c;
    for (int to : g[v]) {
        if (color[to] == 0)
            dfs(to, 3 - c);       // сосед — за другой стол
        else if (color[to] == c)
            ok = false;           // два врага за одним столом
    }
}

int main() {
    int n, m;
    cin >> n >> m;
    g.resize(n + 1);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }

    color.assign(n + 1, 0);
    for (int v = 1; v <= n; v++)
        if (color[v] == 0)
            dfs(v, 1);

    if (!ok) {
        cout << "NO\n";
        return 0;
    }
    cout << "YES\n";
    for (int v = 1; v <= n; v++)
        if (color[v] == 1)
            cout << v << ' ';
    cout << '\n';
}
