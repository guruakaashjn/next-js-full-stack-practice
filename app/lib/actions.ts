'use server';

// By adding the 'use server', you mark all the exported functions within the file as 
// Server Actions. These server functions can then be imported and used in Client
//  and Server components. Any functions included in this file that are not used
//  will be automatically removed from the final application bundle.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id: true, date: true});

export async function createInvoice(formData: FormData){

    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES(${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({id: true, date: true});

export async function updateInvoice(id: string, formData: FormData){
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amoutnInCents = amount * 100;

    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amoutnInCents}, status = ${status}
    WHERE id = ${id}
    `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string){
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    
    revalidatePath('/dashboard/invoices');
}