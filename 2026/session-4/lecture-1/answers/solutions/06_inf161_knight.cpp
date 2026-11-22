// informatics.msk.ru, задача 161 «Один конь»
// Граф неявный: вершина — клетка доски, рёбра — ходы коня.
// BFS от стартовой клетки, par хранит предыдущую клетку для восстановления пути.
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n, x1, y1, x2, y2;
    cin >> n >> x1 >> y1 >> x2 >> y2;

    int dx[8] = {1, 2, 2, 1, -1, -2, -2, -1};
    int dy[8] = {2, 1, -1, -2, -2, -1, 1, 2};

    vector<vector<int>> dist(n + 1, vector<int>(n + 1, -1));
    vector<vector<pair<int, int>>> par(n + 1, vector<pair<int, int>>(n + 1, {-1, -1}));
    queue<pair<int, int>> q;
    dist[x1][y1] = 0;
    q.push({x1, y1});
    while (!q.empty()) {
        auto [x, y] = q.front();
        q.pop();
        for (int k = 0; k < 8; k++) {
            int nx = x + dx[k], ny = y + dy[k];
            if (nx < 1 || nx > n || ny < 1 || ny > n) continue;   // вышли за доску
            if (dist[nx][ny] != -1) continue;                     // уже были
            dist[nx][ny] = dist[x][y] + 1;
            par[nx][ny] = {x, y};
            q.push({nx, ny});
        }
    }

    // при n >= 5 конь доходит до любой клетки, так что dist[x2][y2] != -1
    vector<pair<int, int>> path;
    for (pair<int, int> c = {x2, y2}; c.first != -1; c = par[c.first][c.second])
        path.push_back(c);
    reverse(path.begin(), path.end());

    cout << dist[x2][y2] << '\n';
    for (auto [x, y] : path) cout << x << ' ' << y << '\n';
}
