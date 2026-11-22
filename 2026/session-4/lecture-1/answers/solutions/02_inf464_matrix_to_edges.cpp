// informatics.msk.ru, задача 464 «От матрицы смежности к списку ребер, неориентированный вариант»
// Ребро u–v выводим один раз: берём только клетки над главной диагональю (i < j).
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<vector<int>> a(n + 1, vector<int>(n + 1));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            cin >> a[i][j];

    for (int i = 1; i <= n; i++)
        for (int j = i + 1; j <= n; j++)
            if (a[i][j] == 1)
                cout << i << ' ' << j << '\n';
}
