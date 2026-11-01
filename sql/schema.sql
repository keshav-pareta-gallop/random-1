-- PostgreSQL DDL — translated from SQL Server dbo schema
-- Source: random-2/sql/schema.sql
-- Objects: 2 tables (customers, orders), 1 view (customer_lifetime_value)
-- Dependency order: customers → orders → customer_lifetime_value

CREATE TABLE customers (
    customer_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    order_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'shipped', 'delivered')),
    placed_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE VIEW customer_lifetime_value AS
SELECT
    c.customer_id,
    c.email,
    COALESCE(SUM(o.total), 0) AS lifetime_value,
    COUNT(o.order_id) AS order_count
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.email;
