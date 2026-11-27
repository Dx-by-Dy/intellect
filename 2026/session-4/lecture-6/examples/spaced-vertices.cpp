#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

constexpr int impossible = -1;

int add_counts(int a, int b) {
    return a == impossible || b == impossible ? impossible : a + b;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, min_distance;
    cin >> n >> min_distance;
    if (min_distance <= 1) {
        cout << n << '\n';
        return 0;
    }
    if (min_distance >= n) {
        cout << 1 << '\n';
        return 0;
    }

    vector<vector<int>> g(n + 1);
    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }

    vector<int> parent(n + 1);
    vector<int> order{1};
    order.reserve(n);
    for (size_t i = 0; i < order.size(); ++i) {
        int v = order[i];
        for (int to : g[v]) {
            if (to != parent[v]) {
                parent[to] = v;
                order.push_back(to);
            }
        }
    }

    vector<vector<int>> dp(n + 1, vector<int>(min_distance + 1, impossible));
    vector<int> shifted(min_distance + 1);
    vector<int> current_suffix(min_distance + 1), child_suffix(min_distance + 1);
    for (auto it = order.rbegin(); it != order.rend(); ++it) {
        int v = *it;
        auto& current = dp[v];
        current[0] = 1;
        current[min_distance] = 0;

        for (int to : g[v]) {
            if (to == parent[v]) {
                continue;
            }
            const auto& child = dp[to];
            shifted[0] = impossible;
            for (int d = 1; d < min_distance; ++d) {
                shifted[d] = child[d - 1];
            }
            shifted[min_distance] = max(child[min_distance - 1], child[min_distance]);

            current_suffix[min_distance] = current[min_distance];
            child_suffix[min_distance] = shifted[min_distance];
            for (int d = min_distance - 1; d >= 0; --d) {
                current_suffix[d] = max(current[d], current_suffix[d + 1]);
                child_suffix[d] = max(shifted[d], child_suffix[d + 1]);
            }

            for (int d = 0; d <= min_distance; ++d) {
                int need = max(d, min_distance - d);
                current[d] = max(add_counts(current[d], child_suffix[need]),
                                 add_counts(shifted[d], current_suffix[need]));
            }
        }
    }
    cout << *max_element(dp[1].begin(), dp[1].end()) << '\n';
}
