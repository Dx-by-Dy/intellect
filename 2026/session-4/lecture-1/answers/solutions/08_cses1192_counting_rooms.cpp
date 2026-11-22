// CSES 1192 «Counting Rooms»
// Клетки '.' — вершины, соседние по стороне клетки соединены. Ответ — число компонент связности.
// Поле до 1000 x 1000 = 10^6 клеток: рекурсивный DFS может уйти на глубину 10^6
// и переполнить стек, поэтому обходим каждую комнату BFS-ом.
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    vector<string> a(n);
    for (auto& row : a) cin >> row;

    int dx[4] = {1, -1, 0, 0};
    int dy[4] = {0, 0, 1, -1};
    vector<vector<bool>> used(n, vector<bool>(m, false));

    int rooms = 0;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < m; j++) {
            if (a[i][j] == '#' || used[i][j]) continue;
            rooms++;                       // новая комната — обойдём её целиком
            queue<pair<int, int>> q;
            used[i][j] = true;
            q.push({i, j});
            while (!q.empty()) {
                auto [x, y] = q.front();
                q.pop();
                for (int k = 0; k < 4; k++) {
                    int nx = x + dx[k], ny = y + dy[k];
                    if (nx < 0 || nx >= n || ny < 0 || ny >= m) continue;
                    if (a[nx][ny] == '#' || used[nx][ny]) continue;
                    used[nx][ny] = true;
                    q.push({nx, ny});
                }
            }
        }
    cout << rooms << '\n';
}
