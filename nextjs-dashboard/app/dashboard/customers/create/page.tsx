import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import CustomerForm from '@/app/ui/customers/customer-form';

export const metadata = { title: 'Create Customer' };

export default function Page() {
  return (
    <main>
      <Breadcrumbs breadcrumbs={[
        { label: 'Customers', href: '/dashboard/customers' },
        { label: 'Create Customer', href: '/dashboard/customers/create', active: true },
      ]} />
      <CustomerForm />
    </main>
  );
}
