import Image from 'next/image';
import Link from 'next/link';
import { fetchFilteredCustomers } from '@/app/lib/data';
import type { FormattedCustomersTable } from '@/app/lib/definitions';
import { UpdateCustomer } from '@/app/ui/customers/buttons';
import DeleteCustomer from '@/app/ui/customers/delete-customer';

export default async function CustomersTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const customers: FormattedCustomersTable[] = await fetchFilteredCustomers(query, currentPage);

  if (customers.length === 0) {
    return (
      <div className="mt-6 rounded-lg bg-gray-50 px-6 py-12 text-center">
        <h2 className="text-lg font-medium text-gray-900">No customers found</h2>
        <p className="mt-2 text-sm text-gray-500">{query ? `No customers match “${query}”. Try another search.` : 'There are no customers yet. Create your first customer to get started.'}</p>
        {!query && <Link className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500" href="/dashboard/customers/create">Create customer</Link>}
      </div>
    );
  }

  return (
    <div className="mt-6 flow-root">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
            <div className="md:hidden">
              {customers.map((customer) => (
                <div key={customer.id} className="mb-2 w-full rounded-md bg-white p-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="min-w-0">
                      <Link href={`/dashboard/customers/${customer.id}`} className="mb-2 flex items-center gap-3 font-medium hover:text-blue-600">
                        <Image src={customer.image_url} className="rounded-full" alt={`${customer.name}'s profile picture`} width={28} height={28} />
                        <span>{customer.name}</span>
                      </Link>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                    <div className="flex gap-2"><UpdateCustomer id={customer.id} /><DeleteCustomer id={customer.id} query={query} /></div>
                  </div>
                  <div className="flex w-full justify-between border-b py-5">
                    <div><p className="text-xs">Pending</p><p className="font-medium">{customer.total_pending}</p></div>
                    <div><p className="text-xs">Paid</p><p className="font-medium">{customer.total_paid}</p></div>
                  </div>
                  <p className="pt-4 text-sm">{customer.total_invoices} invoices</p>
                </div>
              ))}
            </div>
            <table className="hidden min-w-full rounded-md text-gray-900 md:table">
              <thead className="rounded-md bg-gray-50 text-left text-sm font-normal"><tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Name</th>
                <th scope="col" className="px-3 py-5 font-medium">Email</th>
                <th scope="col" className="px-3 py-5 font-medium">Total Invoices</th>
                <th scope="col" className="px-3 py-5 font-medium">Total Pending</th>
                <th scope="col" className="px-4 py-5 font-medium">Total Paid</th>
                <th scope="col" className="px-4 py-5 font-medium"><span className="sr-only">Actions</span></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-200 text-gray-900">
                {customers.map((customer) => (
                  <tr key={customer.id} className="group">
                    <td className="whitespace-nowrap bg-white py-5 pl-4 pr-3 text-sm text-black sm:pl-6">
                      <Link href={`/dashboard/customers/${customer.id}`} className="flex items-center gap-3 hover:text-blue-600">
                        <Image src={customer.image_url} className="rounded-full" alt={`${customer.name}'s profile picture`} width={28} height={28} /><span>{customer.name}</span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">{customer.email}</td>
                    <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">{customer.total_invoices}</td>
                    <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">{customer.total_pending}</td>
                    <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">{customer.total_paid}</td>
                    <td className="whitespace-nowrap bg-white px-4 py-5 text-sm"><div className="flex items-center justify-end gap-2"><UpdateCustomer id={customer.id} /><DeleteCustomer id={customer.id} query={query} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
