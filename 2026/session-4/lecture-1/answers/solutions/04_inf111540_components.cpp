// informatics.msk.ru, задача 111540 «Компоненты связности»
// n, m <= 100 000 — матрица не поместится (10^10 ячеек), храним списки смежности.
// Компоненты ищем DFS-ом из каждой ещё не посещённой вершины.
// DFS здесь написан с явным стеком, а не рекурсией: граф может быть цепочкой
// из 100 000 вершин, и глубокая рекурсия рискует переполнить стек программы.
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

    vector<bool> used(n + 1, false);
    vector<vector<int>> comps;
    for (int s = 1; s <= n; s++) {
        if (used[s]) continue;
        vector<int> comp;          // вершины текущей компоненты
        vector<int> st = {s};      // явный стек вместо рекурсии
        used[s] = true;
        while (!st.empty()) {
            int v = st.back();
            st.pop_back();
            comp.push_back(v);
            for (int to : g[v])
                if (!used[to]) {
                    used[to] = true;   // помечаем при добавлении, чтобы не положить дважды
                    st.push_back(to);
                }
        }
        comps.push_back(comp);
    }

    cout << comps.size() << '\n';
    for (auto& comp : comps) {
        sort(comp.begin(), comp.end());
        cout << comp.size() << '\n';
        for (int v : comp) cout << v << ' ';
        cout << '\n';
    }
}
