'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Schema for form data
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

/**
 * Create a new invoice
 */
const CreateInvoice = FormSchema.omit({ id: true, date: true }); // omit id and date fields

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // Store monetary values in cents to avoid floating point errors
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD | 2023-10-05T14:48:00.000Z akan menjadi 2023-10-05

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath('/dashboard/invoices'); // Once the invoice is created, revalidate the invoices page
  redirect('/dashboard/invoices'); // Redirect to the invoices page
}

/**
 * Update an existing invoice
 */
const UpdateInvoice = FormSchema.omit({ id: true, date: true }); // omit id and date fields

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices'); // Once the invoice is updated, revalidate the invoices page
  redirect('/dashboard/invoices'); // Redirect to the invoices page
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(id: string) {
  await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices'); // Once the invoice is deleted, revalidate the invoices page
}
