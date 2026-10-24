import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import InvoiceStatus from '@/app/ui/invoices/status';
import { fetchCustomerById } from '@/app/lib/data';
import { formatCurrency, formatDateToLocal } from '@/app/lib/utils';
import { lusitana } from '@/app/ui/fonts';

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const customer = await fetchCustomerById(id);
  return { title: customer ? customer.name : 'Customer not found' };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const customer = await fetchCustomerById(id);
  if (!customer) notFound();

  return (
    <main className="w-full">
      <Breadcrumbs breadcrumbs={[
        { label: 'Customers', href: '/dashboard/customers' },
        { label: customer.name, href: `/dashboard/customers/${id}`, active: true },
      ]} />
      <section className="rounded-xl bg-gray-50 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Image src={customer.image_url} alt={`${customer.name}'s profile picture`} width={72} height={72} className="rounded-full" priority />
            <div><h1 className={`${lusitana.className} text-2xl`}>{customer.name}</h1><p className="mt-1 text-sm text-gray-600">{customer.email}</p></div>
          </div>
          <Link href={`/dashboard/customers/${id}/edit`} className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">Edit customer</Link>
        </div>
      </section>
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-blue-50 p-5"><p className="text-sm text-gray-600">Total invoices</p><p className="mt-2 text-2xl font-semibold">{customer.total_invoices}</p></div>
        <div className="rounded-xl bg-gray-50 p-5"><p className="text-sm text-gray-600">Total pending</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(customer.total_pending)}</p></div>
        <div className="rounded-xl bg-green-50 p-5"><p className="text-sm text-gray-600">Total paid</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(customer.total_paid)}</p></div>
      </section>
      <section className="mt-8">
        <h2 className={`${lusitana.className} text-xl`}>Invoice history</h2>
        {customer.invoices.length === 0 ? (
          <p className="mt-4 rounded-lg bg-gray-50 p-6 text-sm text-gray-600">This customer has no invoices yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg bg-gray-50 p-2">
            <table className="min-w-full text-left text-sm text-gray-900">
              <thead><tr className="text-gray-600"><th className="px-4 py-4 font-medium">Date</th><th className="px-4 py-4 font-medium">Amount</th><th className="px-4 py-4 font-medium">Status</th><th className="px-4 py-4 font-medium">Invoice</th></tr></thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {customer.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="whitespace-nowrap px-4 py-4">{formatDateToLocal(invoice.date)}</td>
                    <td className="whitespace-nowrap px-4 py-4">{formatCurrency(invoice.amount)}</td>
                    <td className="px-4 py-4"><InvoiceStatus status={invoice.status} /></td>
                    <td className="px-4 py-4"><Link href={`/dashboard/invoices/${invoice.id}/edit`} className="text-blue-600 hover:underline">View / edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
