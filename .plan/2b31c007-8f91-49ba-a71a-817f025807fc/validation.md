# Validation

### Decision
Validation is handled by the platform's MVS declarative build-and-verify harness. The DDL script is executed against a clean scratch PostgreSQL instance, and all 8 acceptance criteria are asserted against the **live PostgreSQL catalog** — no offline or parse-only checks.

### Harness Execution Flow
1. The harness boots a clean PostgreSQL instance with an empty `public` schema
2. The DDL script (`sql/schema.sql`) is executed in order: `customers` → `orders` → `customer_lifetime_value`
3. Each acceptance criterion is verified via SQL queries against the live catalog

### Acceptance Criteria → Validation Queries

| AC# | What's Checked | Catalog Source | Pass Condition |
|---|---|---|---|
| 1 | 3 objects CREATE without error | DDL execution result + `pg_tables`, `pg_views` | 0 errors, 3 objects found |
| 2 | 9 columns: name, type, precision, nullability, defaults | `information_schema.columns` vs source spec | 9/9 match on all dimensions |
| 3 | Object types preserved (table vs view) | `information_schema.tables`, `information_schema.views` | 2 BASE TABLE, 1 VIEW |
| 4 | All constraints present | `pg_constraint` (contype p/f/u/c) + `information_schema.columns` for defaults | 2 PK + 1 FK + 1 UNIQUE + 1 CHECK + 3 DEFAULT |
| 5 | FK type consistency | `pg_constraint` join to column types | `orders.customer_id` (int) → `customers.customer_id` (int) |
| 6 | SELECT * succeeds on all 3 objects + smoke insert | Live queries | 0 errors, view returns correct COALESCE result |
| 7 | Every object has recorded CREATE + SELECT evidence | Harness execution log | 3/3 verified |
| 8 | All evidence is live-catalog, not offline | Harness execution context | 8/8 live |

### Smoke Test (AC6 detail)
After DDL creation, the harness runs:
1. `SELECT * FROM public.customers` — 0 rows, no error
2. `SELECT * FROM public.orders` — 0 rows, no error
3. `SELECT * FROM public.customer_lifetime_value` — 0 rows, no error
4. `INSERT INTO customers (full_name, email) VALUES ('Test User', 'test@example.com')` — exercises IDENTITY + DEFAULT now()
5. `SELECT * FROM customer_lifetime_value` — returns 1 row with `lifetime_value = 0`, `order_count = 0` (validates COALESCE null-handling)

### Constraint Verification Queries
- **PKs**: `SELECT conname FROM pg_constraint WHERE contype = 'p'` — expect 2
- **FK**: `SELECT conname FROM pg_constraint WHERE contype = 'f'` — expect 1, referencing `customers(customer_id)`
- **UNIQUE**: `SELECT conname FROM pg_constraint WHERE contype = 'u'` — expect 1 on `email`
- **CHECK**: `SELECT conname FROM pg_constraint WHERE contype = 'c'` — expect CHECK with `status` IN clause (excluding NOT NULL checks which PostgreSQL also stores as contype 'c')
- **DEFAULTS**: `SELECT column_name, column_default FROM information_schema.columns WHERE column_default IS NOT NULL` — expect `now()` on `created_at`/`placed_at`, `'placed'` on `status`

### Edge Cases Handled
- **GENERATED ALWAYS AS IDENTITY**: INSERT without specifying `customer_id` must auto-assign; INSERT *with* `customer_id` must fail (unless `OVERRIDING SYSTEM VALUE`)
- **NOT NULL on all 9 columns**: No column accepts NULL — verified via `information_schema.columns.is_nullable = 'NO'`
- **CHECK constraint values**: Only `'placed'`, `'shipped'`, `'delivered'` — no N-prefix remnants
- **View column types**: `lifetime_value` is `NUMERIC` (from SUM of NUMERIC), `order_count` is `BIGINT` (from COUNT)
- **Empty-table aggregation**: The view must return 0 (not NULL) for `lifetime_value` when a customer has no orders — validated by the smoke insert test
