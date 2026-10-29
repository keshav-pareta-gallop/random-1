#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Resolve backend URL from the manifest (services declare their own database,
# so $BASE_URL may not be set).
url() {
  node -e 'console.log("http://127.0.0.1:" + require("./preview.manifest.json").services[process.argv[1]].port)' "$1"
}
BACKEND=$(url backend)

PASS=0
FAIL=0
check() {
  local label="$1"; shift
  if "$@"; then
    echo "✅  $label"
    PASS=$((PASS + 1))
  else
    echo "❌  $label"
    FAIL=$((FAIL + 1))
  fi
}

AUTH="Authorization: Bearer smoke-token"

# ---------- Health ----------
check "GET /api/health returns 200" \
  curl -fsS "$BACKEND/api/health"
echo ""

# ---------- AC3: missing title → 400 ----------
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BACKEND/api/tasks" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{}')
check "POST without title returns 400" [ "$HTTP_CODE" = "400" ]

# AC3: whitespace-only title → 400
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BACKEND/api/tasks" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"title":"   "}')
check "POST with whitespace-only title returns 400" [ "$HTTP_CODE" = "400" ]

# ---------- AC1: create task with all fields ----------
RESP=$(curl -fsS -X POST "$BACKEND/api/tasks" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"title":"Smoke full task","description":"A test description","dueDate":"2026-12-31"}')
echo "Create (all fields): $RESP"

TASK_ID=$(echo "$RESP" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);process.stdout.write(o.id)})")
TASK_STATUS=$(echo "$RESP" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);process.stdout.write(o.status)})")
TASK_TITLE=$(echo "$RESP" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);process.stdout.write(o.title)})")
TASK_DESC=$(echo "$RESP" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);process.stdout.write(o.description||'')})")
TASK_DUE=$(echo "$RESP" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);process.stdout.write(o.dueDate||'')})")

check "Created task has an id" [ -n "$TASK_ID" ]
check "Status defaults to todo" [ "$TASK_STATUS" = "todo" ]
check "Title matches" [ "$TASK_TITLE" = "Smoke full task" ]
check "Description matches" [ "$TASK_DESC" = "A test description" ]
check "Due date matches" [ "$TASK_DUE" = "2026-12-31" ]

# ---------- AC2: create task with title only (no description, no dueDate) ----------
RESP2=$(curl -fsS -X POST "$BACKEND/api/tasks" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"title":"Title only task"}')
echo "Create (title only): $RESP2"

TASK2_STATUS=$(echo "$RESP2" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);process.stdout.write(o.status)})")
TASK2_DESC=$(echo "$RESP2" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);process.stdout.write(String(o.description))})")
TASK2_DUE=$(echo "$RESP2" | node -e "process.stdin.on('data',d=>{const o=JSON.parse(d);process.stdout.write(String(o.dueDate))})")

check "Title-only task defaults to todo" [ "$TASK2_STATUS" = "todo" ]
check "Title-only task has null description" [ "$TASK2_DESC" = "null" ]
check "Title-only task has null dueDate" [ "$TASK2_DUE" = "null" ]

# ---------- AC4: persistence — tasks appear in GET list ----------
LIST=$(curl -fsS "$BACKEND/api/tasks" -H "$AUTH")
echo "Task list: $LIST"

COUNT=$(echo "$LIST" | node -e "process.stdin.on('data',d=>{const a=JSON.parse(d);process.stdout.write(String(a.length))})")
check "GET /api/tasks returns at least 2 tasks" [ "$COUNT" -ge 2 ]

FOUND_FULL=$(echo "$LIST" | node -e "process.stdin.on('data',d=>{const a=JSON.parse(d);process.stdout.write(a.some(t=>t.title==='Smoke full task')?'yes':'no')})")
check "Full task found in list (persistence)" [ "$FOUND_FULL" = "yes" ]

FOUND_TITLE=$(echo "$LIST" | node -e "process.stdin.on('data',d=>{const a=JSON.parse(d);process.stdout.write(a.some(t=>t.title==='Title only task')?'yes':'no')})")
check "Title-only task found in list (persistence)" [ "$FOUND_TITLE" = "yes" ]

# ---------- 401: missing Authorization header ----------
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BACKEND/api/tasks")
check "GET /api/tasks without auth header returns 401" [ "$HTTP_CODE" = "401" ]

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BACKEND/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title":"No auth"}')
check "POST /api/tasks without auth header returns 401" [ "$HTTP_CODE" = "401" ]

# ---------- Summary ----------
echo ""
echo "========================================="
echo "  PASSED: $PASS   FAILED: $FAIL"
echo "========================================="
[ "$FAIL" -eq 0 ]
