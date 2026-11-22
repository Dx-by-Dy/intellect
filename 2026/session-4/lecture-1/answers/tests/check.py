#!/usr/bin/env python3
"""Checker for the lesson solutions.

Usage: check.py <problem-dir-name> <input> <output> <answer>

Many problems accept several correct outputs (any shortest path, any order of
components, any valid seating), so instead of comparing text the checker
validates the contestant output against the input. The .ans file holds the
jury value (count, length, YES/NO) and is cross-checked against a reference
computed here, so a typo in a hand-written .ans is reported too.
"""
import sys
from collections import deque


class WrongAnswer(Exception):
    pass


def expect(cond, msg):
    if not cond:
        raise WrongAnswer(msg)


def ints(text):
    return list(map(int, text.split()))


def read_matrix(tok, n):
    return [[0] * (n + 1)] + [[0] + tok[1 + i * n: 1 + (i + 1) * n] for i in range(n)]


def bfs_dist(n, nbrs, s):
    dist = [-1] * (n + 1)
    dist[s] = 0
    q = deque([s])
    while q:
        v = q.popleft()
        for to in nbrs(v):
            if dist[to] == -1:
                dist[to] = dist[v] + 1
                q.append(to)
    return dist


def components(n, edges):
    parent = list(range(n + 1))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v in edges:
        parent[find(u)] = find(v)
    groups = {}
    for v in range(1, n + 1):
        groups.setdefault(find(v), set()).add(v)
    return sorted(groups.values(), key=min)


def check_exact(inp, out, ans, ref):
    expect(ans.split() == ref.split(), f"bad .ans: expected {ref.split()}, file has {ans.split()}")
    expect(out.split() == ans.split(), f"expected {ans.split()}, got {out.split()}")


# --- per-problem checkers ---------------------------------------------------

def p01(inp, out, ans):
    t = ints(inp)
    n = t[0]
    check_exact(inp, out, ans, str(sum(t[1:1 + n * n]) // 2))


def p02(inp, out, ans):
    t = ints(inp)
    n = t[0]
    a = read_matrix(t, n)
    ref = {(i, j) for i in range(1, n + 1) for j in range(i + 1, n + 1) if a[i][j]}
    o = ints(out)
    expect(len(o) % 2 == 0, "odd number of integers in output")
    got = [tuple(sorted(o[k:k + 2])) for k in range(0, len(o), 2)]
    expect(len(got) == len(set(got)), "an edge is printed twice")
    expect(set(got) == ref, f"edge set differs: missing {sorted(ref - set(got))}, extra {sorted(set(got) - ref)}")
    a_ = ints(ans)
    expect({tuple(sorted(a_[k:k + 2])) for k in range(0, len(a_), 2)} == ref, "bad .ans")


def p03(inp, out, ans):
    t = ints(inp)
    n, s = t[0], t[1]
    a = read_matrix(t[1:], n)
    d = bfs_dist(n, lambda v: [u for u in range(1, n + 1) if a[v][u]], s)
    check_exact(inp, out, ans, str(sum(1 for v in range(1, n + 1) if d[v] != -1)))


def p04(inp, out, ans):
    t = ints(inp)
    n, m = t[0], t[1]
    edges = [(t[2 + 2 * i], t[3 + 2 * i]) for i in range(m)]
    ref = components(n, edges)
    expect(int(ans.split()[0]) == len(ref), "bad .ans")
    lines = [l for l in out.split("\n") if l.strip()]
    expect(lines and int(lines[0]) == len(ref), f"expected {len(ref)} components")
    got = []
    expect(len(lines) == 1 + 2 * len(ref), "wrong number of lines")
    for k in range(len(ref)):
        size = int(lines[1 + 2 * k])
        verts = ints(lines[2 + 2 * k])
        expect(size == len(verts), f"component {k + 1}: size {size} but {len(verts)} vertices listed")
        got.append(set(verts))
    expect(sorted(got, key=min) == ref, "components differ from the reference")


def p05(inp, out, ans):
    t = ints(inp)
    n = t[0]
    a = read_matrix(t, n)
    s, f = t[1 + n * n], t[2 + n * n]
    d = bfs_dist(n, lambda v: [u for u in range(1, n + 1) if a[v][u]], s)[f]
    expect(int(ans.split()[0]) == d, f"bad .ans: reference length {d}")
    o = ints(out)
    expect(o and o[0] == d, f"expected length {d}, got {o[:1]}")
    if d <= 0:
        expect(len(o) == 1, "nothing but the length must be printed")
        return
    path = o[1:]
    expect(len(path) == d + 1, f"path must have {d + 1} vertices, got {len(path)}")
    expect(path[0] == s and path[-1] == f, "path must go from start to finish")
    for x, y in zip(path, path[1:]):
        expect(a[x][y] == 1, f"no edge {x}-{y}")


def p06(inp, out, ans):
    n, x1, y1, x2, y2 = ints(inp)
    moves = [(1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1), (-2, 1), (-1, 2)]
    idx = lambda x, y: (x - 1) * n + y
    cell = lambda v: ((v - 1) // n + 1, (v - 1) % n + 1)

    def nb(v):
        x, y = cell(v)
        return [idx(x + dx, y + dy) for dx, dy in moves if 1 <= x + dx <= n and 1 <= y + dy <= n]

    d = bfs_dist(n * n, nb, idx(x1, y1))[idx(x2, y2)]
    expect(int(ans.split()[0]) == d, f"bad .ans: reference {d}")
    o = ints(out)
    expect(o and o[0] == d, f"expected {d} moves, got {o[:1]}")
    pts = [(o[1 + 2 * k], o[2 + 2 * k]) for k in range((len(o) - 1) // 2)]
    expect(len(o) == 1 + 2 * (d + 1), f"expected {d + 1} cells")
    expect(pts[0] == (x1, y1) and pts[-1] == (x2, y2), "path must start at the knight and end at the grass")
    for (a, b), (c, e) in zip(pts, pts[1:]):
        expect((c - a, e - b) in moves and 1 <= c <= n and 1 <= e <= n, f"illegal move {a},{b} -> {c},{e}")


def p07(inp, out, ans):
    t = ints(inp)
    n, m = t[0], t[1]
    edges = [(t[2 + 2 * i], t[3 + 2 * i]) for i in range(m)]
    g = [[] for _ in range(n + 1)]
    for u, v in edges:
        g[u].append(v)
        g[v].append(u)
    col = [0] * (n + 1)
    ok = True
    for s in range(1, n + 1):
        if col[s]:
            continue
        col[s] = 1
        q = deque([s])
        while q:
            v = q.popleft()
            for to in g[v]:
                if col[to] == 0:
                    col[to] = 3 - col[v]
                    q.append(to)
                elif col[to] == col[v]:
                    ok = False
    ref = "YES" if ok else "NO"
    expect(ans.split()[0] == ref, f"bad .ans: reference {ref}")
    words = out.split()
    expect(words and words[0] == ref, f"expected {ref}")
    if not ok:
        expect(len(words) == 1, "nothing must follow NO")
        return
    first = set(map(int, words[1:]))
    expect(all(1 <= v <= n for v in first), "vertex out of range")
    for u, v in edges:
        expect((u in first) != (v in first), f"{u} and {v} sit at the same table")


def p08(inp, out, ans):
    lines = inp.split()
    n, m = int(lines[0]), int(lines[1])
    a = lines[2:2 + n]
    seen = [[False] * m for _ in range(n)]
    rooms = 0
    for i in range(n):
        for j in range(m):
            if a[i][j] == '.' and not seen[i][j]:
                rooms += 1
                seen[i][j] = True
                q = deque([(i, j)])
                while q:
                    x, y = q.popleft()
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= nx < n and 0 <= ny < m and a[nx][ny] == '.' and not seen[nx][ny]:
                            seen[nx][ny] = True
                            q.append((nx, ny))
    check_exact(inp, out, ans, str(rooms))


def p09(inp, out, ans):
    t = ints(inp)
    n, m = t[0], t[1]
    edges = [(t[2 + 2 * i], t[3 + 2 * i]) for i in range(m)]
    indeg = [0] * (n + 1)
    g = [[] for _ in range(n + 1)]
    for a, b in edges:
        g[a].append(b)
        indeg[b] += 1
    q = deque(v for v in range(1, n + 1) if indeg[v] == 0)
    cnt = 0
    while q:
        v = q.popleft()
        cnt += 1
        for to in g[v]:
            indeg[to] -= 1
            if indeg[to] == 0:
                q.append(to)
    ref = "Yes" if cnt == n else "No"
    expect(ans.split()[0] == ref, f"bad .ans: reference {ref}")
    words = out.split()
    expect(words and words[0] == ref, f"expected {ref}")
    if ref == "No":
        expect(len(words) == 1, "nothing must follow No")
        return
    order = list(map(int, words[1:]))
    expect(sorted(order) == list(range(1, n + 1)), "output is not a permutation of 1..n")
    pos = {v: k for k, v in enumerate(order)}
    for a, b in edges:
        expect(pos[a] < pos[b], f"{a} must stand before {b}")


def p10(inp, out, ans):
    t = ints(inp)
    n, m = t[0], t[1]
    g = [[] for _ in range(n + 1)]
    es = set()
    for i in range(m):
        u, v = t[2 + 2 * i], t[3 + 2 * i]
        g[u].append(v)
        g[v].append(u)
        es.add((u, v))
        es.add((v, u))
    d = bfs_dist(n, lambda v: g[v], 1)[n]
    ref = "IMPOSSIBLE" if d == -1 else str(d + 1)
    expect(ans.split()[0] == ref, f"bad .ans: reference {ref}")
    words = out.split()
    expect(words and words[0] == ref, f"expected {ref}")
    if d == -1:
        return
    path = list(map(int, words[1:]))
    expect(len(path) == d + 1, f"path must have {d + 1} computers")
    expect(path[0] == 1 and path[-1] == n, "path must go from 1 to n")
    for x, y in zip(path, path[1:]):
        expect((x, y) in es, f"no connection {x}-{y}")


CHECKERS = {f"{k:02}": f for k, f in enumerate([p01, p02, p03, p04, p05, p06, p07, p08, p09, p10], 1)}


def main():
    name, inp, out, ans = sys.argv[1:5]
    read = lambda p: open(p, encoding="utf-8").read()
    try:
        CHECKERS[name[:2]](read(inp), read(out), read(ans))
    except WrongAnswer as e:
        print(f"WA: {e}")
        sys.exit(1)
    except (ValueError, IndexError, KeyError) as e:
        print(f"PE: cannot parse output ({type(e).__name__}: {e})")
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
