#!/usr/bin/env bash
# Compile every solution and run it on its tests.
# Usage: ./run_tests.sh            - all solutions
#        ./run_tests.sh 05 07      - only solutions whose names start with 05 or 07
set -u
cd "$(dirname "$0")"

build=$(mktemp -d)
trap 'rm -rf "$build"' EXIT

total=0
failed=0
for src in solutions/*.cpp; do
    name=$(basename "$src" .cpp)
    if [ $# -gt 0 ]; then
        match=0
        for p in "$@"; do [[ $name == "$p"* ]] && match=1; done
        [ $match -eq 1 ] || continue
    fi
    if ! g++ -std=c++17 -O2 -Wall -Wextra -o "$build/$name" "$src" 2> "$build/$name.log"; then
        echo "[$name] COMPILATION ERROR"
        cat "$build/$name.log"
        failed=$((failed + 1))
        continue
    fi
    for inp in tests/"$name"/*.in; do
        total=$((total + 1))
        t=$(basename "$inp" .in)
        out="$build/$name.$t.out"
        if ! timeout 5 "$build/$name" < "$inp" > "$out"; then
            echo "[$name] test $t: RUNTIME ERROR or TIMEOUT"
            failed=$((failed + 1))
            continue
        fi
        verdict=$(python3 tests/check.py "$name" "$inp" "$out" "${inp%.in}.ans")
        if [ "$verdict" != "OK" ]; then
            echo "[$name] test $t: $verdict"
            failed=$((failed + 1))
        fi
    done
    echo "[$name] done"
done

echo "Tests run: $total, failed: $failed"
[ $failed -eq 0 ]
