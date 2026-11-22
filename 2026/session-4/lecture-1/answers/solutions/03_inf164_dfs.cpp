// informatics.msk.ru, задача 164 «Обход в глубину»
// Граф задан матрицей смежности, n <= 100. Запускаем DFS из s и считаем посещённые вершины.
// С матрицей перебор соседей стоит O(n), весь обход O(n^2) — при n = 100 это мгновенно.
#include <bits/stdc++.h>
using namespace std;

int n;
vector<vector<int>> a;
vector<bool> used;
int cnt = 0;

void dfs(int v) {
    used[v] = true;
    cnt++;
    for (int to = 1; to <= n; to++)
        if (a[v][to] == 1 && !used[to])
            dfs(to);
}

int main() {
    int s;
    cin >> n >> s;
    a.assign(n + 1, vector<int>(n + 1));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            cin >> a[i][j];

    used.assign(n + 1, false);
    dfs(s);
    cout << cnt << '\n';
}
