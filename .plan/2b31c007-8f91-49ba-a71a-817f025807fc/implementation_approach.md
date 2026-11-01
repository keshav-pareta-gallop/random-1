# Implementation Approach

### Decision
Produce a single PostgreSQL DDL script at `sql/schema.sql` that creates all 3 objects in dependency order, applying the locked type mappings and dialect substitutions from the source `random-2/sql/schema.sql`.

### Deliverable
One file: **`sql/schema.sql`** — a self-contained DDL script that creates:
1. `public.customers` table (4 columns)
2. `public.orders` table (5 columns, FK → customers)
3. `public.customer_lifetime_value` view (LEFT JOIN aggregate)

### Translation Rules Applied
All 4 locked type mappings and all 4 dialect substitutions are deterministic find-and-replace — no hand-rewrite or semantic analysis:

| # | Rule | Source | Target |
|---|---|---|---|
| 1 | Type: identity | `INT IDENTITY(1,1)` | `INT GENERATED ALWAYS AS IDENTITY` |
| 2 | Type: string | `NVARCHAR(n)` | `VARCHAR(n)` |
| 3 | Type: decimal | `DECIMAL(10,2)` | `NUMERIC(10,2)` |
| 4 | Type: datetime | `DATETIME2` | `TIMESTAMP` |
| 5 | Dialect: null coalesce | `ISNULL(expr, default)` | `COALESCE(expr, default)` |
| 6 | Dialect: UTC time | `SYSUTCDATETIME()` | `now()` |
| 7 | Dialect: unicode prefix | `N'literal'` | `'literal'` |
| 8 | Dialect: batch separator | `GO` | *(removed)* |

### Identifier Convention
All identifiers lowercased to snake_case per the locked Schema & Type Mapping decision:
- `CustomerId` → `customer_id`, `FullName` → `full_name`, `CreatedAt` → `created_at`
- `OrderId` → `order_id`, `PlacedAt` → `placed_at`
- `CustomerLifetimeValue` → `customer_lifetime_value`
- `LifetimeValue` → `lifetime_value`, `OrderCount` → `order_count`

### Dependency Order
The script executes statements in this order:
1. `CREATE TABLE customers` — no dependencies
2. `CREATE TABLE orders` — depends on `customers` (FK)
3. `CREATE VIEW customer_lifetime_value` — depends on both tables

### Width Ground Truth
The story explicitly notes the TRD mapping table has Email and FullName widths swapped. The **source DDL is ground truth**:
- `Email` → `NVARCHAR(255)` → `VARCHAR(255)` ✓
- `FullName` → `NVARCHAR(120)` → `VARCHAR(120)` ✓

### What Is NOT Built
- No migration tooling (Flyway, Liquibase) — per locked CI/CD decision
- No additional indexes beyond those auto-created by PK/UNIQUE constraints — per locked Performance decision
- No FK index on `orders.customer_id` — deliberately deferred per TRD
- No seed data in the DDL script — per locked Ingestion decision
- No `DROP IF EXISTS` guards — the harness runs against a clean database each time
