#include <iostream>
#include <vector>

using namespace std;

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

    vector<int> parent(n + 1), depth(n + 1), size(n + 1, 1);
    vector<long long> sum(n + 1);
    vector<int> order{1};
    order.reserve(n);
    for (size_t i = 0; i < order.size(); ++i) {
        int v = order[i];
        sum[1] += depth[v];
        for (int to : g[v]) {
            if (to != parent[v]) {
                parent[to] = v;
                depth[to] = depth[v] + 1;
                order.push_back(to);
            }
        }
    }

    for (auto it = order.rbegin(); it != order.rend(); ++it) {
        int v = *it;
        if (v != 1) {
            size[parent[v]] += size[v];
        }
    }
    for (int v : order) {
        if (v != 1) {
            sum[v] = sum[parent[v]] + n - 2LL * size[v];
        }
    }
    for (int v = 1; v <= n; ++v) {
        cout << sum[v] << (v == n ? '\n' : ' ');
    }
}
