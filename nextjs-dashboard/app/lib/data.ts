import { sql } from "./db";
import {
  CustomerField,
  CustomersTableType,
  FormattedCustomersTable,
  InvoiceForm,
  InvoicesTable,
  LatestInvoice,
  LatestInvoiceRaw,
  Revenue,
} from "./definitions";
import { formatCurrency } from "./utils";

// Create or reuse a single Postgres client across module reloads/workers.
// Caching on `globalThis` prevents creating many pools during Next.js
// dev HMR or across multiple server instances, which can exhaust DB
// connections (EMAXCONNSESSION).
// const globalRef = globalThis as unknown as { __pg_sql?: any };
// const sql =
//   globalRef.__pg_sql ??
//   (globalRef.__pg_sql = postgres(process.env.POSTGRES_URL!, {
//     ssl: "require",
//     // Limit the number of clients this process will open. Tune as needed.
//     max: 4,
//   }));

const SKIP_DB_DURING_BUILD =
  (process.env.SKIP_DB_DURING_BUILD || "").toLowerCase() === "true";

export async function fetchRevenue() {
  try {
    if (SKIP_DB_DURING_BUILD) return [] as Revenue[];
    console.log("DB revenue START");
    const data = await sql<Revenue[]>`
      SELECT
        TO_CHAR(month_start, 'Mon') AS month,
        COALESCE(
          SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END),
          0
        )::float / 100 AS paid,
        COALESCE(
          SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END),
          0
        )::float / 100 AS pending
      FROM GENERATE_SERIES(
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) AS months(month_start)
      LEFT JOIN invoices
        ON invoices.date >= months.month_start
        AND invoices.date < months.month_start + INTERVAL '1 month'
      GROUP BY month_start
      ORDER BY month_start
    `;
    console.log("DB revenue DONE");
    console.log("fetchRevenue first row:", JSON.stringify(data[0]));
    return data;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch revenue data.");
  }
}

export async function fetchLatestInvoices(): Promise<LatestInvoice[]> {
  try {
    if (SKIP_DB_DURING_BUILD) return [];
    console.log("DB latest invoices START");
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice: LatestInvoiceRaw) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    console.log("DB latest invoices DONE");
    return latestInvoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest invoices.");
  }
}

export async function fetchCardData() {
  try {
    if (SKIP_DB_DURING_BUILD)
      return {
        numberOfCustomers: 0,
        numberOfInvoices: 0,
        totalPaidInvoices: formatCurrency(0),
        totalPendingInvoices: formatCurrency(0),
      };
    console.log("DB cards START");
    const [summary] = await sql<
      {
        invoice_count: string;
        customer_count: string;
        paid: string;
        pending: string;
      }[]
    >`
      SELECT
        COUNT(*) AS invoice_count,
        (SELECT COUNT(*) FROM customers) AS customer_count,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS paid,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending
      FROM invoices
    `;
    console.log("DB cards DONE");
    const numberOfInvoices = Number(summary.invoice_count);
    const numberOfCustomers = Number(summary.customer_count);
    const totalPaidInvoices = formatCurrency(Number(summary.paid));
    const totalPendingInvoices = formatCurrency(Number(summary.pending));
    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error("Database Error:", error);
    // Fail open: return safe defaults so the UI can render even if the DB is
    // unavailable (useful for builds and developer machines).
    return {
      numberOfCustomers: 0,
      numberOfInvoices: 0,
      totalPaidInvoices: formatCurrency(0),
      totalPendingInvoices: formatCurrency(0),
    };
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    if (SKIP_DB_DURING_BUILD) return [] as InvoicesTable[];
    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoices.");
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    if (SKIP_DB_DURING_BUILD) return 0;
    const data = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of invoices.");
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    if (SKIP_DB_DURING_BUILD) return null;
    const data = await sql<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.map((invoice: InvoiceForm) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));
    console.log(invoice);
    return invoice[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch invoice.");
  }
}

export async function fetchCustomers() {
  try {
    if (SKIP_DB_DURING_BUILD) return [] as CustomerField[];
    const customers = await sql<CustomerField[]>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    return customers;
  } catch (err) {
    console.error("Database Error:", err);
    throw new Error("Failed to fetch all customers.");
  }
}

export async function fetchFilteredCustomers(
  query: string,
  currentPage = 1,
): Promise<FormattedCustomersTable[]> {
  const offset = (Math.max(1, currentPage) - 1) * ITEMS_PER_PAGE;
  try {
    if (SKIP_DB_DURING_BUILD) return [];
    const rows = await sql<CustomersTableType[]>`
      SELECT
        customers.id,
        customers.name,
        customers.email,
        customers.image_url,
        COUNT(invoices.id)::int AS total_invoices,
        COALESCE(SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END), 0)::bigint AS total_pending,
        COALESCE(SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END), 0)::bigint AS total_paid
      FROM customers
      LEFT JOIN invoices ON customers.id = invoices.customer_id
      WHERE customers.name ILIKE ${`%${query}%`}
         OR customers.email ILIKE ${`%${query}%`}
      GROUP BY customers.id, customers.name, customers.email, customers.image_url
      ORDER BY customers.name ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
    return rows.map((customer) => ({
      ...customer,
      total_invoices: Number(customer.total_invoices),
      total_pending: formatCurrency(Number(customer.total_pending)),
      total_paid: formatCurrency(Number(customer.total_paid)),
    }));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch customer table.");
  }
}

export async function fetchCustomersPages(query: string): Promise<number> {
  try {
    if (SKIP_DB_DURING_BUILD) return 0;
    const rows = await sql<{ count: string }[]>`
      SELECT COUNT(*) FROM customers
      WHERE name ILIKE ${`%${query}%`} OR email ILIKE ${`%${query}%`}
    `;
    return Math.ceil(Number(rows[0]?.count ?? 0) / ITEMS_PER_PAGE);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch total number of customers.");
  }
}

export type CustomerInvoice = {
  id: string;
  date: string;
  amount: number;
  status: "pending" | "paid";
};

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
  invoices: CustomerInvoice[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function fetchCustomerById(
  id: string,
): Promise<CustomerProfile | null> {
  // Validate before interpolating into a UUID comparison: malformed IDs must
  // produce the route's 404 instead of a Postgres invalid-input-syntax error.
  if (!UUID_PATTERN.test(id)) return null;
  try {
    if (SKIP_DB_DURING_BUILD) return null;
    const rows = await sql<Omit<CustomerProfile, "invoices">[]>`
      SELECT c.id, c.name, c.email, c.image_url,
        COUNT(i.id)::int AS total_invoices,
        COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'pending'), 0)::bigint AS total_pending,
        COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid'), 0)::bigint AS total_paid
      FROM customers c
      LEFT JOIN invoices i ON i.customer_id = c.id
      WHERE c.id = ${id}
      GROUP BY c.id, c.name, c.email, c.image_url
    `;
    if (!rows[0]) return null;
    const invoices = await sql<CustomerInvoice[]>`
      SELECT id, date::text AS date, amount, status
      FROM invoices
      WHERE customer_id = ${id}
      ORDER BY date DESC, id DESC
    `;
    return {
      ...rows[0],
      total_invoices: Number(rows[0].total_invoices),
      total_pending: Number(rows[0].total_pending),
      total_paid: Number(rows[0].total_paid),
      invoices: invoices.map((invoice) => ({
        ...invoice,
        amount: Number(invoice.amount),
      })),
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch customer.");
  }
}
