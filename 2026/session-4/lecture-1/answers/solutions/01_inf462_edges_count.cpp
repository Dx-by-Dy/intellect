// informatics.msk.ru, задача 462 «Подсчет количества ребер неориентированного графа»
// Каждое ребро u–v записано в матрице дважды: a[u][v] = a[v][u] = 1.
// Поэтому считаем все единицы и делим на 2.
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    int ones = 0;
    for (int i = 0; i < n * n; i++) {
        int x;
        cin >> x;
        ones += x;
    }
    cout << ones / 2 << '\n';
}
