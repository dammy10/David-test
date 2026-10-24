"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import {
  getOAuthProviderCredentials,
  type OAuthProviderId,
} from "@/app/lib/auth-providers";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
// import postgres from "postgres";
import { sql } from "./db";

const FormSchema = z.object({
  id: z.string(),
  customerId: z
    .string({ invalid_type_error: "Please select a customer." })
    .min(1, { message: "Please select a customer." }),
  amount: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.coerce
      .number({ invalid_type_error: "Please enter an amount." })
      .gt(0, { message: "Please enter an amount greater than $0." }),
  ),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // We'll also log the error to the console for now
    console.error(error);
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    // We'll also log the error to the console for now
    console.error(error);
    return { message: "Database Error: Failed to Update Invoice." };
  }
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(
  id: string,
  _prevState: State,
  _formData: FormData,
): Promise<State> {
  let invoiceDeleted: boolean;
  try {
    const deletedInvoices =
      await sql`DELETE FROM invoices WHERE id = ${id} RETURNING id`;
    invoiceDeleted = deletedInvoices.length > 0;
  } catch (error) {
    console.error("Database Error:", error);
    return { message: "Database Error: Failed to Delete Invoice." };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");

  if (!invoiceDeleted) {
    return { message: "Invoice was already deleted. The list was refreshed." };
  }

  return { message: null };
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }

    throw error;
  }
}

export async function authenticateWithOAuth(formData: FormData) {
  const provider = formData.get("provider");
  if (provider !== "github" && provider !== "google") {
    throw new Error("Unsupported sign-in provider.");
  }

  const oauthProvider: OAuthProviderId = provider;
  if (!getOAuthProviderCredentials(oauthProvider)) {
    throw new Error(
      `OAuth credentials are not configured for ${oauthProvider}.`,
    );
  }

  const callbackUrl = formData.get("redirectTo");
  const redirectTo =
    typeof callbackUrl === "string" &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//") &&
    !callbackUrl.includes("\\")
      ? callbackUrl
      : "/dashboard";

  const authorizationParams =
    oauthProvider === "google" ? { prompt: "select_account" } : undefined;

  await signIn(oauthProvider, { redirectTo }, authorizationParams);
}


const CUSTOMER_AVATARS = [
  '/customers/amy-burns.png',
  '/customers/balazs-orban.png',
  '/customers/delba-de-oliveira.png',
  '/customers/evil-rabbit.png',
  '/customers/lee-robinson.png',
  '/customers/michael-novotny.png',
] as const;

const CustomerSchema = z.object({
  name: z.string().trim().min(1, 'Enter the customer name.').max(120, 'Name must be 120 characters or fewer.'),
  email: z.string().trim().email('Enter a valid email address.').max(254, 'Email is too long.'),
  image_url: z.string().refine((value) => CUSTOMER_AVATARS.includes(value as (typeof CUSTOMER_AVATARS)[number]), {
    message: 'Choose one of the available avatars.',
  }),
});

export type CustomerActionState = {
  errors?: { name?: string[]; email?: string[]; image_url?: string[] };
  message?: string | null;
  values?: { name?: string; email?: string; image_url?: string };
};

function customerValues(formData: FormData) {
  return {
    name: formData.get('name'),
    email: formData.get('email'),
    image_url: formData.get('image_url'),
  };
}

function isDuplicateEmail(error: unknown) {
  return typeof error === 'object' && error !== null &&
    'code' in error && (error as { code?: string }).code === '23505';
}

export async function createCustomer(
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const values = customerValues(formData);
  const validated = CustomerSchema.safeParse(values);
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Please correct the highlighted fields.',
      values: {
        name: typeof values.name === 'string' ? values.name : '',
        email: typeof values.email === 'string' ? values.email : '',
        image_url: typeof values.image_url === 'string' ? values.image_url : CUSTOMER_AVATARS[0],
      },
    };
  }
  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${validated.data.name}, ${validated.data.email}, ${validated.data.image_url})
    `;
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return {
        errors: { email: ['A customer with this email already exists.'] },
        message: 'Please use a different email address.',
        values: { name: validated.data.name, email: validated.data.email, image_url: validated.data.image_url },
      };
    }
    console.error('Database Error:', error);
    return { message: 'Unable to create the customer right now.', values: { name: validated.data.name, email: validated.data.email, image_url: validated.data.image_url } };
  }
  revalidatePath('/dashboard/customers');
  revalidatePath('/dashboard/invoices/create');
  revalidatePath('/dashboard');
  redirect('/dashboard/customers');
}

export async function updateCustomer(
  id: string,
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  if (!UUID_PATTERN_FOR_ACTION.test(id)) return { message: 'Invalid customer ID.' };
  const values = customerValues(formData);
  const validated = CustomerSchema.safeParse(values);
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Please correct the highlighted fields.',
      values: {
        name: typeof values.name === 'string' ? values.name : '',
        email: typeof values.email === 'string' ? values.email : '',
        image_url: typeof values.image_url === 'string' ? values.image_url : CUSTOMER_AVATARS[0],
      },
    };
  }
  try {
    const result = await sql`
      UPDATE customers SET name = ${validated.data.name}, email = ${validated.data.email}, image_url = ${validated.data.image_url}
      WHERE id = ${id} RETURNING id
    `;
    if (result.length === 0) return { message: 'This customer no longer exists.' };
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return {
        errors: { email: ['A customer with this email already exists.'] },
        message: 'Please use a different email address.',
        values: { name: validated.data.name, email: validated.data.email, image_url: validated.data.image_url },
      };
    }
    console.error('Database Error:', error);
    return { message: 'Unable to update the customer right now.', values: { name: validated.data.name, email: validated.data.email, image_url: validated.data.image_url } };
  }
  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${id}`);
  revalidatePath(`/dashboard/customers/${id}/edit`);
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard');
  redirect(`/dashboard/customers/${id}`);
}

const UUID_PATTERN_FOR_ACTION = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function deleteCustomer(
  id: string,
  query: string,
  _prevState: { message?: string | null },
  _formData: FormData,
): Promise<{ message: string | null }> {
  if (!UUID_PATTERN_FOR_ACTION.test(id)) return { message: 'Invalid customer ID.' };
  try {
    const invoices = await sql<{ count: string }[]>`
      SELECT COUNT(*) FROM invoices WHERE customer_id = ${id}
    `;
    if (Number(invoices[0]?.count ?? 0) > 0) {
      return { message: 'This customer has invoices and cannot be deleted. Remove or reassign their invoices first.' };
    }
    const deleted = await sql`DELETE FROM customers WHERE id = ${id} RETURNING id`;
    if (deleted.length === 0) return { message: 'This customer was already deleted.' };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error &&
        (error as { code?: string }).code === '23503') {
      return { message: 'This customer has invoices and cannot be deleted. Remove or reassign their invoices first.' };
    }
    console.error('Database Error:', error);
    return { message: 'Unable to delete this customer right now.' };
  }
  revalidatePath('/dashboard/customers');
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard');
  const search = query ? `?query=${encodeURIComponent(query)}` : '';
  redirect(`/dashboard/customers${search}`);
}
