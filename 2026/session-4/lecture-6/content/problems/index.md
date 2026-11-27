# Задачи для практики

Название ведёт к русскому условию. Код площадки открывает оригинал и страницу отправки решения. В задачах LeetCode реализуйте указанный метод класса `Solution`. Площадка передаёт аргументы и проверяет возвращённое значение.

## С чего начать

| Если вы | Маршрут |
| --- | --- |
| Впервые решаете задачи на деревья | [LeetCode 1791](https://leetcode.com/problems/find-center-of-star-graph/){: target="_blank" rel="noopener" } → [ACMP 141](https://acmp.ru/index.asp?main=task&id_task=141){: target="_blank" rel="noopener" } → [CSES 1674](https://cses.fi/problemset/task/1674/){: target="_blank" rel="noopener" } → [CSES 1131](https://cses.fi/problemset/task/1131/){: target="_blank" rel="noopener" } |
| Умеете обходить дерево и хотите решать запросы | [CSES 1687](https://cses.fi/problemset/task/1687/){: target="_blank" rel="noopener" } → [CSES 1135](https://cses.fi/problemset/task/1135/){: target="_blank" rel="noopener" } → [CSES 1137](https://cses.fi/problemset/task/1137/){: target="_blank" rel="noopener" } → [CSES 2134](https://cses.fi/problemset/task/2134/){: target="_blank" rel="noopener" } |
| Хотите потренировать динамику по поддеревьям | [LeetCode 337](https://leetcode.com/problems/house-robber-iii/){: target="_blank" rel="noopener" } → [LeetCode 1443](https://leetcode.com/problems/minimum-time-to-collect-all-apples-in-a-tree/){: target="_blank" rel="noopener" } → [CF 1249F](https://codeforces.com/problemset/problem/1249/F?locale=ru){: target="_blank" rel="noopener" } |
| Хотите разобраться в центроидной декомпозиции | [CSES 2079](https://cses.fi/problemset/task/2079/){: target="_blank" rel="noopener" } → [CF 342E](https://codeforces.com/problemset/problem/342/E?locale=ru){: target="_blank" rel="noopener" } → [CSES 2080](https://cses.fi/problemset/task/2080/){: target="_blank" rel="noopener" } |

## Уровень 1. Устройство дерева и простые обходы

| Задача | Тема |
| --- | --- |
| [Центр звезды](../tasks/leetcode-1791.md) · [LeetCode 1791](https://leetcode.com/problems/find-center-of-star-graph/){: target="_blank" rel="noopener" } | вершина, соединённая со всеми остальными |
| [Прямой обход дерева](../tasks/leetcode-589.md) · [LeetCode 589](https://leetcode.com/problems/n-ary-tree-preorder-traversal/){: target="_blank" rel="noopener" } | значения вершин в порядке входа DFS |
| [Обход дерева по уровням](../tasks/leetcode-429.md) · [LeetCode 429](https://leetcode.com/problems/n-ary-tree-level-order-traversal/){: target="_blank" rel="noopener" } | значения вершин, сгруппированные по глубине |
| [Родословная. Подсчёт уровней](../tasks/inf-3771.md) · [Информатикс 3771](https://informatics.mccme.ru/mod/statements/view.php?chapterid=3771){: target="_blank" rel="noopener" } | глубина каждого человека в генеалогическом дереве |
| [Дерево](../tasks/acmp-141.md) · [ACMP 141](https://acmp.ru/index.asp?main=task&id_task=141){: target="_blank" rel="noopener" } | проверка, является ли граф деревом |

## Уровень 2. Реализация изученных алгоритмов

| Задача | Тема |
| --- | --- |
| [Подчинённые](../tasks/cses-1674.md) · [CSES 1674](https://cses.fi/problemset/task/1674/){: target="_blank" rel="noopener" } | число прямых и непрямых подчинённых каждого сотрудника |
| [Диаметр дерева](../tasks/cses-1131.md) · [CSES 1131](https://cses.fi/problemset/task/1131/){: target="_blank" rel="noopener" } | наибольшее расстояние между двумя вершинами |
| [Запросы о начальниках I](../tasks/cses-1687.md) · [CSES 1687](https://cses.fi/problemset/task/1687/){: target="_blank" rel="noopener" } | предок на заданном числе уровней выше |
| [Запросы о расстояниях](../tasks/cses-1135.md) · [CSES 1135](https://cses.fi/problemset/task/1135/){: target="_blank" rel="noopener" } | число рёбер между каждой запрошенной парой вершин |
| [Суммы расстояний](../tasks/cses-1133.md) · [CSES 1133](https://cses.fi/problemset/task/1133/){: target="_blank" rel="noopener" } | сумма расстояний от каждой вершины до остальных |
| [Грабитель домов III](../tasks/leetcode-337.md) · [LeetCode 337](https://leetcode.com/problems/house-robber-iii/){: target="_blank" rel="noopener" } | максимальная сумма значений узлов, среди которых нет соседних |

## Уровень 3. Задачи на одну дополнительную идею

| Задача | Тема |
| --- | --- |
| [Собрать все яблоки](../tasks/leetcode-1443.md) · [LeetCode 1443](https://leetcode.com/problems/minimum-time-to-collect-all-apples-in-a-tree/){: target="_blank" rel="noopener" } | минимальное время сбора всех яблок с возвращением к старту |
| [Вертикальные пути](../tasks/cf-1675d.md) · [CF 1675D](https://codeforces.com/problemset/problem/1675/D?locale=ru){: target="_blank" rel="noopener" } | разбиение дерева на минимальное число непересекающихся путей от родителей к детям |
| [Самые далёкие вершины](../tasks/cses-1132.md) · [CSES 1132](https://cses.fi/problemset/task/1132/){: target="_blank" rel="noopener" } | расстояние от каждой вершины до самой далёкой |
| [Поиск центроида](../tasks/cses-2079.md) · [CSES 2079](https://cses.fi/problemset/task/2079/){: target="_blank" rel="noopener" } | вершина, делящая дерево на компоненты размером не больше половины |
| [Запросы на поддеревьях](../tasks/cses-1137.md) · [CSES 1137](https://cses.fi/problemset/task/1137/){: target="_blank" rel="noopener" } | изменение значения вершины и сумма в поддереве |
| [Подмножество максимального веса](../tasks/cf-1249f.md) · [CF 1249F](https://codeforces.com/problemset/problem/1249/F?locale=ru){: target="_blank" rel="noopener" } | наибольший вес набора с попарными расстояниями строго больше заданного |

## Уровень 4. Со звёздочкой

| Задача | Тема |
| --- | --- |
| [Подсчёт путей](../tasks/cses-1136.md) · [CSES 1136](https://cses.fi/problemset/task/1136/){: target="_blank" rel="noopener" } | число заданных путей, проходящих через каждую вершину |
| [Запросы на путях II](../tasks/cses-2134.md) · [CSES 2134](https://cses.fi/problemset/task/2134/){: target="_blank" rel="noopener" } | изменение значения вершины и максимум на пути |
| [Ксюша и дерево](../tasks/cf-342e.md) · [CF 342E](https://codeforces.com/problemset/problem/342/E?locale=ru){: target="_blank" rel="noopener" } | расстояние до ближайшей красной вершины после перекрашиваний |
| [Пути заданной длины I](../tasks/cses-2080.md) · [CSES 2080](https://cses.fi/problemset/task/2080/){: target="_blank" rel="noopener" } | число пар вершин на расстоянии ровно k рёбер |
