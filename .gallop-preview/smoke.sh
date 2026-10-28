#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Resolve service URLs from the manifest
url() { node -e 'console.log("http://127.0.0.1:" + require("./preview.manifest.json").services[process.argv[1]].port)' "$1"; }
BACKEND=$(url backend)
FRONTEND=$(url frontend)

PASS=0
FAIL=0

check() {
  local desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "✅ PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL: $desc"
    FAIL=$((FAIL + 1))
  fi
}

# ---------- Wait for backend readiness ----------

echo ""
echo "Waiting for backend..."
for i in $(seq 1 30); do
  curl -fsS "$BACKEND/api/health" >/dev/null 2>&1 && break
  sleep 1
done

# ---------- AC1: GET /api/orders returns 3 seeded orders ----------

echo ""
echo "=== AC1: GET /api/orders returns the three seeded orders ==="

ORDERS_JSON=$(curl -fsS "$BACKEND/api/orders")
echo "Response: $ORDERS_JSON"

# Check total is 3
TOTAL=$(echo "$ORDERS_JSON" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).total))")
check "total is 3" [ "$TOTAL" = "3" ]

# Check items count is 3
ITEMS_COUNT=$(echo "$ORDERS_JSON" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).items.length))")
check "items array has 3 entries" [ "$ITEMS_COUNT" = "3" ]

# Check each item has required fields: id, placedAt, total, status
FIELDS_OK=$(echo "$ORDERS_JSON" | node -e "
process.stdin.resume();
let d='';
process.stdin.on('data',c=>d+=c);
process.stdin.on('end',()=>{
  const items = JSON.parse(d).items;
  const ok = items.every(i => 'id' in i && 'placedAt' in i && 'total' in i && 'status' in i);
  console.log(ok ? 'true' : 'false');
});
")
check "every item has id, placedAt, total, status" [ "$FIELDS_OK" = "true" ]

# Check the specific seeded order IDs
IDS=$(echo "$ORDERS_JSON" | node -e "
process.stdin.resume();
let d='';
process.stdin.on('data',c=>d+=c);
process.stdin.on('end',()=>{
  const ids = JSON.parse(d).items.map(i=>i.id).sort().join(',');
  console.log(ids);
});
")
check "seeded IDs are ord-001,ord-002,ord-003" [ "$IDS" = "ord-001,ord-002,ord-003" ]

# Verify specific field values for each order
VALS_OK=$(echo "$ORDERS_JSON" | node -e "
process.stdin.resume();
let d='';
process.stdin.on('data',c=>d+=c);
process.stdin.on('end',()=>{
  const items = JSON.parse(d).items;
  const m = Object.fromEntries(items.map(i=>[i.id, i]));
  const ok = m['ord-001'].status === 'delivered'
          && m['ord-002'].status === 'shipped'
          && m['ord-003'].status === 'processing'
          && typeof m['ord-001'].total === 'number'
          && typeof m['ord-001'].placedAt === 'string';
  console.log(ok ? 'true' : 'false');
});
")
check "order field values match seed data" [ "$VALS_OK" = "true" ]

# ---------- AC2: /orders page is served and will render orders ----------

echo ""
echo "=== AC2: /orders page is served and contains order-rendering markup ==="

ORDERS_HTML=$(curl -fsS "$FRONTEND/orders")

check "/orders returns HTML with Order History heading" grep -q "Order History" <<< "$ORDERS_HTML"

# The page is a client component — the fetch call and rendering logic are in a JS bundle.
# Extract JS chunk URLs from the HTML and fetch them to verify.
JS_URLS=$(echo "$ORDERS_HTML" | grep -oE '/_next/static/chunks/[^"]+\.js' | sort -u)
ALL_JS=""
for url in $JS_URLS; do
  CHUNK=$(curl -sS "$FRONTEND$url" 2>/dev/null || true)
  ALL_JS="$ALL_JS$CHUNK"
done

# Combine HTML + JS for checks (the text may be in either)
ALL_CONTENT="$ORDERS_HTML$ALL_JS"

check "/orders page or JS bundles reference /api/orders fetch" grep -q "/api/orders" <<< "$ALL_CONTENT"

# ---------- AC3: 'No orders yet' text is in the client code ----------

echo ""
echo "=== AC3: 'No orders yet' text exists in the page or JS bundles ==="

check "'No orders yet' text present in page or JS" grep -q "No orders yet" <<< "$ALL_CONTENT"

# ---------- Summary ----------

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

echo "All smoke checks passed."
exit 0
