#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

using namespace std;

class SumTree {
public:
    explicit SumTree(const vector<long long>& values)
        : n(static_cast<int>(values.size())), data(2 * n) {
        copy(values.begin(), values.end(), data.begin() + n);
        for (int i = n - 1; i >= 1; --i) {
            data[i] = data[2 * i] + data[2 * i + 1];
        }
    }

    void assign(int pos, long long value) {
        int i = pos + n;
        data[i] = value;
        while (i > 1) {
            i /= 2;
            data[i] = data[2 * i] + data[2 * i + 1];
        }
    }

    long long sum(int left, int right) const {
        long long result = 0;
        for (left += n, right += n; left < right; left /= 2, right /= 2) {
            if (left % 2 != 0) {
                result += data[left++];
            }
            if (right % 2 != 0) {
                result += data[--right];
            }
        }
        return result;
    }

private:
    int n;
    vector<long long> data;
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
    vector<long long> value(n + 1);
    for (int v = 1; v <= n; ++v) {
        cin >> value[v];
    }

    vector<int> parent(n + 1), depth(n + 1), size(n + 1, 1), heavy(n + 1);
    vector<int> order{1};
    for (size_t i = 0; i < order.size(); ++i) {
        int v = order[i];
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
        for (int to : g[v]) {
            if (to == parent[v]) {
                continue;
            }
            size[v] += size[to];
            if (heavy[v] == 0 || size[to] > size[heavy[v]]) {
                heavy[v] = to;
            }
        }
    }

    vector<int> head(n + 1), pos(n + 1);
    vector<long long> linear(n);
    vector<int> pending{1};
    head[1] = 1;
    int timer = 0;
    while (!pending.empty()) {
        int v = pending.back();
        pending.pop_back();
        pos[v] = timer++;
        linear[pos[v]] = value[v];

        for (auto it = g[v].rbegin(); it != g[v].rend(); ++it) {
            int to = *it;
            if (to != parent[v] && to != heavy[v]) {
                head[to] = to;
                pending.push_back(to);
            }
        }
        if (heavy[v] != 0) {
            head[heavy[v]] = head[v];
            pending.push_back(heavy[v]);
        }
    }
    SumTree tree(linear);

    for (int i = 0; i < q; ++i) {
        int type, u;
        cin >> type >> u;
        if (type == 1) {
            long long x;
            cin >> x;
            tree.assign(pos[u], x);
            continue;
        }
        int v;
        cin >> v;
        long long result = 0;
        while (head[u] != head[v]) {
            if (depth[head[u]] < depth[head[v]]) {
                swap(u, v);
            }
            result += tree.sum(pos[head[u]], pos[u] + 1);
            u = parent[head[u]];
        }
        result += tree.sum(min(pos[u], pos[v]), max(pos[u], pos[v]) + 1);
        cout << result << '\n';
    }
}
