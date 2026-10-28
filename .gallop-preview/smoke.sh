#!/usr/bin/env bash
set -uo pipefail

# Smoke tests for: Customer opens one order's details
# Uses $BASE_URL set by the platform (backend URL).

BASE_URL="${BASE_URL:?BASE_URL must be set}"
FAIL=0

fail() { echo "FAIL: $1"; FAIL=1; }

# 1. GET /api/orders — 200 with non-empty items array
echo "--- Check 1: GET /api/orders returns 200 with non-empty items ---"
RESP=$(curl -s -w '\n%{http_code}' "$BASE_URL/api/orders")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  fail "GET /api/orders returned $HTTP_CODE, expected 200"
else
  echo "  Status: 200 OK"
fi

ITEMS_COUNT=$(echo "$BODY" | node -e "const d=require('fs').readFileSync(0,'utf8');try{const j=JSON.parse(d);console.log((j.items||[]).length)}catch(e){console.log('0')}" || echo "0")
if [ "$ITEMS_COUNT" -lt 1 ] 2>/dev/null; then
  fail "GET /api/orders returned empty items array"
else
  echo "  Items count: $ITEMS_COUNT"
fi

# 2. Extract first order id
ORDER_ID=$(echo "$BODY" | node -e "const d=require('fs').readFileSync(0,'utf8');try{const j=JSON.parse(d);console.log(j.items[0].id)}catch(e){console.log('')}" || echo "")
echo "  First order id: $ORDER_ID"

if [ -z "$ORDER_ID" ]; then
  fail "Could not extract an order id from GET /api/orders"
fi

# 3. GET /api/orders/:id — 200, has lines array with sku/name/qty/price
echo "--- Check 2: GET /api/orders/$ORDER_ID returns 200 with lines ---"
if [ -n "$ORDER_ID" ]; then
  RESP=$(curl -s -w '\n%{http_code}' "$BASE_URL/api/orders/$ORDER_ID")
  HTTP_CODE=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | sed '$d')

  if [ "$HTTP_CODE" != "200" ]; then
    fail "GET /api/orders/$ORDER_ID returned $HTTP_CODE, expected 200"
  else
    echo "  Status: 200 OK"
  fi

  # Verify lines array exists and has entries with required fields
  LINES_OK=$(echo "$BODY" | node -e "
const d=require('fs').readFileSync(0,'utf8');
try {
  const j=JSON.parse(d);
  if (!Array.isArray(j.lines) || j.lines.length === 0) { console.log('no_lines'); process.exit(0); }
  const allValid = j.lines.every(l => 'sku' in l && 'name' in l && 'qty' in l && 'price' in l);
  console.log(allValid ? 'ok' : 'missing_fields');
} catch(e) { console.log('parse_error'); }
" || echo "parse_error")

  if [ "$LINES_OK" = "no_lines" ]; then
    fail "GET /api/orders/$ORDER_ID has no lines array or it is empty"
  elif [ "$LINES_OK" = "missing_fields" ]; then
    fail "GET /api/orders/$ORDER_ID lines are missing sku/name/qty/price fields"
  elif [ "$LINES_OK" = "parse_error" ]; then
    fail "GET /api/orders/$ORDER_ID returned non-JSON response"
  else
    LINES_COUNT=$(echo "$BODY" | node -e "const d=require('fs').readFileSync(0,'utf8');try{console.log(JSON.parse(d).lines.length)}catch(e){console.log('?')}" || echo "?")
    echo "  Lines count: $LINES_COUNT — all have sku, name, qty, price"
  fi

  # Verify order header fields
  HEADER_OK=$(echo "$BODY" | node -e "
const d=require('fs').readFileSync(0,'utf8');
try {
  const j=JSON.parse(d);
  const ok = 'id' in j && 'placedAt' in j && 'total' in j && 'status' in j;
  console.log(ok ? 'ok' : 'missing');
} catch(e) { console.log('parse_error'); }
" || echo "parse_error")
  if [ "$HEADER_OK" != "ok" ]; then
    fail "GET /api/orders/$ORDER_ID missing header fields (id/placedAt/total/status)"
  else
    echo "  Header fields: id, placedAt, total, status present"
  fi
else
  fail "Skipped Check 2 — no order id extracted"
fi

# 4. GET /api/orders/<unknown> — 404 with {"error":"Order not found"}
echo "--- Check 3: GET /api/orders/nonexistent-id-12345 returns 404 ---"
RESP=$(curl -s -w '\n%{http_code}' "$BASE_URL/api/orders/nonexistent-id-12345")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')

if [ "$HTTP_CODE" != "404" ]; then
  fail "GET /api/orders/nonexistent-id-12345 returned $HTTP_CODE, expected 404"
else
  echo "  Status: 404"
fi

ERROR_MSG=$(echo "$BODY" | node -e "const d=require('fs').readFileSync(0,'utf8');try{console.log(JSON.parse(d).error)}catch(e){console.log('')}" || echo "")
if [ "$ERROR_MSG" != "Order not found" ]; then
  fail "Expected error 'Order not found', got '$ERROR_MSG'"
else
  echo "  Error message: Order not found"
fi

# Summary
echo ""
if [ "$FAIL" -ne 0 ]; then
  echo "SMOKE TESTS FAILED"
  exit 1
else
  echo "ALL SMOKE TESTS PASSED"
  exit 0
fi
