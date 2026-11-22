# Задачи для практики

Задачи разбиты на 4 уровня. Номера и условия проверены на сайтах в ноябре 2026.

- **inf** — [informatics.msk.ru](https://informatics.msk.ru). Условия на русском, для отправки нужна регистрация.
- **CSES** — [cses.fi/problemset](https://cses.fi/problemset/), раздел Graph Algorithms. Условия только на английском, нужна регистрация.
- **CF** — Codeforces, рейтинг задачи в скобках. Ссылки ведут на русские условия.

Застряли надолго — спросите преподавателя, он подскажет, куда смотреть.

## С чего начать

| Если вы | Маршрут |
|---|---|
| видите графы впервые и C++ знаете слабо | 462 → 464 → 465 → 470 → 164 → 160 → 111540 |
| уверенно пишете циклы и работаете с массивами | 464 → 164 → 111540 → 160 → 161 → 165 → CSES 1192 |
| занимаетесь олимпиадами | сразу уровень 3, потом 4 |

## Уровень 1. Хранение графа

Здесь нет обходов: нужно прочитать граф и разобраться с матрицей смежности и списком рёбер.

| Задача | Тема |
|---|---|
| [inf 462](https://informatics.msk.ru/mod/statements/view.php?chapterid=462) Подсчет количества ребер неориентированного графа | чтение матрицы |
| [inf 464](https://informatics.msk.ru/mod/statements/view.php?chapterid=464) От матрицы смежности к списку ребер | матрица → рёбра |
| [inf 465](https://informatics.msk.ru/mod/statements/view.php?chapterid=465) От списка ребер к матрице смежности | рёбра → матрица |
| [inf 470](https://informatics.msk.ru/mod/statements/view.php?chapterid=470) Степени вершин | степень |
| [inf 175](https://informatics.msk.ru/mod/statements/view.php?chapterid=175) Светофорчики | степень по списку рёбер |
| [inf 474](https://informatics.msk.ru/mod/statements/view.php?chapterid=474) Истоки и стоки | ориентированный граф |
| [inf 460](https://informatics.msk.ru/mod/statements/view.php?chapterid=460) Проверка на неориентированность | свойства матрицы |

## Уровень 2. Базовые обходы

Нужно написать DFS или BFS «как в лекции» и немного дописать вокруг.

| Задача | Тема |
|---|---|
| [inf 164](https://informatics.msk.ru/mod/statements/view.php?chapterid=164) Обход в глубину | DFS по матрице |
| [inf 111540](https://informatics.msk.ru/mod/statements/view.php?chapterid=111540) Компоненты связности | внешний цикл DFS |
| [inf 160](https://informatics.msk.ru/mod/statements/view.php?chapterid=160) Путь | BFS + восстановление пути |
| [inf 161](https://informatics.msk.ru/mod/statements/view.php?chapterid=161) Один конь | BFS на доске |
| [inf 111541](https://informatics.msk.ru/mod/statements/view.php?chapterid=111541) Баобаб | что такое дерево |
| [CSES 1192](https://cses.fi/problemset/task/1192) Counting Rooms | компоненты на поле |
| [CSES 1666](https://cses.fi/problemset/task/1666) Building Roads | компоненты |
| [CSES 1667](https://cses.fi/problemset/task/1667) Message Route | BFS на больших данных |
| [CF 115A](https://codeforces.com/problemset/problem/115/A?locale=ru) Party (900) | лес, глубина |

## Уровень 3. Применения обходов

Нужно увидеть граф в условии или применить обход нестандартно.

| Задача | Тема |
|---|---|
| [inf 165](https://informatics.msk.ru/mod/statements/view.php?chapterid=165) Банкет | двудольность |
| [CSES 1668](https://cses.fi/problemset/task/1668) Building Teams | двудольность |
| [inf 162](https://informatics.msk.ru/mod/statements/view.php?chapterid=162) Табличка | BFS из многих стартов |
| [inf 163](https://informatics.msk.ru/mod/statements/view.php?chapterid=163) Два коня | BFS по состояниям |
| [CSES 1193](https://cses.fi/problemset/task/1193) Labyrinth | BFS + путь на поле |
| [CSES 1669](https://cses.fi/problemset/task/1669) Round Trip | поиск цикла |
| [CF 893C](https://codeforces.com/problemset/problem/893/C?locale=ru) Rumor (1300) | компоненты |
| [CF 862B](https://codeforces.com/problemset/problem/862/B?locale=ru) Mahmoud and Ehab and the bipartiteness (1300) | двудольность дерева |
| [CF 520B](https://codeforces.com/problemset/problem/520/B?locale=ru) Two Buttons (1400) | неявный граф |
| [CF 977E](https://codeforces.com/problemset/problem/977/E?locale=ru) Cyclic Components (1500) | компоненты + степени |
| [CF 580C](https://codeforces.com/problemset/problem/580/C?locale=ru) Kefa and Park (1500) | DFS по дереву |

## Уровень 4. Со звёздочкой

| Задача | Тема |
|---|---|
| [inf 166](https://informatics.msk.ru/mod/statements/view.php?chapterid=166) Построение | топологическая сортировка |
| [CSES 1679](https://cses.fi/problemset/task/1679) Course Schedule | топологическая сортировка |
| [CSES 1194](https://cses.fi/problemset/task/1194) Monsters | два BFS |
| [CF 377A](https://codeforces.com/problemset/problem/377/A?locale=ru) Maze (1600) | порядок обхода |
| [CF 1006E](https://codeforces.com/problemset/problem/1006/E?locale=ru) Military Problem (1600) | эйлеров обход дерева |
| [CF 1037D](https://codeforces.com/problemset/problem/1037/D?locale=ru) Valid BFS? (1700) | устройство BFS |
| [CF 1365D](https://codeforces.com/problemset/problem/1365/D?locale=ru) Solve The Maze (1700) | BFS на поле |
| [CF 1093D](https://codeforces.com/problemset/problem/1093/D?locale=ru) Beautiful Graph (1700) | двудольность + комбинаторика |
| [CF 1272E](https://codeforces.com/problemset/problem/1272/E?locale=ru) Nearest Opposite Parity (1900) | обратный граф + BFS из многих стартов |
| [CF 1520G](https://codeforces.com/problemset/problem/1520/G?locale=ru) To Go Or Not To Go? (2200) | два BFS + аккуратность |
