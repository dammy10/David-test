import { notFound } from 'next/navigation';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import CustomerForm from '@/app/ui/customers/customer-form';
import { fetchCustomerById } from '@/app/lib/data';

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const customer = await fetchCustomerById(id);
  return { title: customer ? `Edit ${customer.name}` : 'Customer not found' };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const customer = await fetchCustomerById(id);
  if (!customer) notFound();
  return (
    <main>
      <Breadcrumbs breadcrumbs={[
        { label: 'Customers', href: '/dashboard/customers' },
        { label: customer.name, href: `/dashboard/customers/${id}` },
        { label: 'Edit Customer', href: `/dashboard/customers/${id}/edit`, active: true },
      ]} />
      <CustomerForm customer={customer} />
    </main>
  );
}
