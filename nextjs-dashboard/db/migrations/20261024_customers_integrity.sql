-- Customers feature hardening.
-- 1) Check and resolve duplicate email addresses before creating the unique index:
-- SELECT lower(email), count(*) FROM customers GROUP BY lower(email) HAVING count(*) > 1;
-- 2) Check for orphan invoices before adding the FK:
-- SELECT i.id, i.customer_id FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id WHERE c.id IS NULL;
-- Resolve any rows returned by either check before applying this migration.

CREATE UNIQUE INDEX IF NOT EXISTS customers_email_unique_ci
  ON customers (lower(email));

-- Protect the refusal-on-delete policy against races and prevent future orphan invoices.
ALTER TABLE invoices
  ADD CONSTRAINT invoices_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
  NOT VALID;

ALTER TABLE invoices VALIDATE CONSTRAINT invoices_customer_id_fkey;
