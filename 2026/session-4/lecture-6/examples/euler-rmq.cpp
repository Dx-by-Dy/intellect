#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

using namespace std;

struct DfsFrame {
    int vertex;
    int parent;
    size_t next_neighbor = 0;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, q;
    cin >> n >> q;
    vector<vector<int>> g(n + 1);
    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }

    vector<int> depth(n + 1), first(n + 1);
    vector<int> tour{1};
    tour.reserve(2 * n - 1);
    vector<DfsFrame> stack{{1, 0}};
    while (!stack.empty()) {
        DfsFrame& frame = stack.back();
        int v = frame.vertex;
        if (frame.next_neighbor == g[v].size()) {
            stack.pop_back();
            if (!stack.empty()) {
                tour.push_back(stack.back().vertex);
            }
            continue;
        }
        int to = g[v][frame.next_neighbor++];
        if (to == frame.parent) {
            continue;
        }
        depth[to] = depth[v] + 1;
        first[to] = static_cast<int>(tour.size());
        tour.push_back(to);
        stack.push_back({to, v});
    }

    int m = static_cast<int>(tour.size());
    vector<int> log2_floor(m + 1);
    for (int len = 2; len <= m; ++len) {
        log2_floor[len] = log2_floor[len / 2] + 1;
    }
    auto shallower = [&](int u, int v) {
        return depth[u] <= depth[v] ? u : v;
    };

    vector<vector<int>> minimum(log2_floor[m] + 1);
    minimum[0] = move(tour);
    for (int j = 1; j <= log2_floor[m]; ++j) {
        int len = 1 << j;
        int half = len / 2;
        minimum[j].resize(m - len + 1);
        for (int i = 0; i + len <= m; ++i) {
            minimum[j][i] = shallower(minimum[j - 1][i], minimum[j - 1][i + half]);
        }
    }

    for (int i = 0; i < q; ++i) {
        int u, v;
        cin >> u >> v;
        int left = min(first[u], first[v]);
        int right = max(first[u], first[v]);
        int j = log2_floor[right - left + 1];
        int len = 1 << j;
        cout << shallower(minimum[j][left], minimum[j][right - len + 1]) << '\n';
    }
}
