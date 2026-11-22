// informatics.msk.ru, задача 166 «Построение» (бонус: топологическая сортировка)
// Ребро A -> B: A выше B, значит A должен стоять раньше B.
// Построиться можно, только если в графе нет цикла.
// DFS с тремя цветами: 0 — не были, 1 — вершина сейчас в стеке вызовов, 2 — вышли.
// Ребро в вершину цвета 1 — это цикл. Вершины, выписанные в порядке выхода
// и развёрнутые задом наперёд, дают нужный порядок.
#include <bits/stdc++.h>
using namespace std;

vector<vector<int>> g;
vector<int> color;
vector<int> order;
bool cycle = false;

void dfs(int v) {
    color[v] = 1;
    for (int to : g[v]) {
        if (color[to] == 0)
            dfs(to);
        else if (color[to] == 1)
            cycle = true;
    }
    color[v] = 2;
    order.push_back(v);   // все, кто ниже v, уже выписаны
}

int main() {
    int n, m;
    cin >> n >> m;
    g.resize(n + 1);
    for (int i = 0; i < m; i++) {
        int a, b;
        cin >> a >> b;
        g[a].push_back(b);
    }

    color.assign(n + 1, 0);
    for (int v = 1; v <= n; v++)
        if (color[v] == 0)
            dfs(v);

    if (cycle) {
        cout << "No\n";
        return 0;
    }
    reverse(order.begin(), order.end());
    cout << "Yes\n";
    for (int v : order) cout << v << ' ';
    cout << '\n';
}
