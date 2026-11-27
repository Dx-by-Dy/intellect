#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>

using namespace std;

int farthest(const vector<vector<int>>& g, int start, vector<int>& parent) {
    parent.assign(g.size(), -1);
    parent[start] = 0;
    queue<int> pending;
    pending.push(start);

    int last = start;
    while (!pending.empty()) {
        int v = pending.front();
        pending.pop();
        last = v;
        for (int to : g[v]) {
            if (parent[to] == -1) {
                parent[to] = v;
                pending.push(to);
            }
        }
    }
    return last;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<vector<int>> g(n + 1);
    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }

    vector<int> parent;
    int a = farthest(g, 1, parent);
    int b = farthest(g, a, parent);
    vector<int> path;
    for (int v = b; v != 0; v = parent[v]) {
        path.push_back(v);
    }
    reverse(path.begin(), path.end());

    cout << path.size() - 1 << '\n';
    for (size_t i = 0; i < path.size(); ++i) {
        cout << path[i] << (i + 1 == path.size() ? '\n' : ' ');
    }
}
