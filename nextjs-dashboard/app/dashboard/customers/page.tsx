import { Suspense } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { lusitana } from '@/app/ui/fonts';
import Search from '@/app/ui/search';
import CustomersTable from '@/app/ui/customers/table';
import Pagination from '@/app/ui/invoices/pagination';
import { CustomersTableSkeleton } from '@/app/ui/skeletons';
import { fetchCustomersPages } from '@/app/lib/data';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
};
export default async function Page(props: {
  searchParams?: Promise<{ query?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query?.trim() || '';
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Customers</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search customers..." />
        <Link href="/dashboard/customers/create" className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500">
          <span className="hidden md:block">Create Customer</span><PlusIcon className="h-5 md:ml-4" />
        </Link>
      </div>
      <Suspense key={`${query}-${currentPage}`} fallback={<CustomersTableSkeleton />}>
        <CustomersTable query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Suspense key={query} fallback={<div className="h-10 w-48 animate-pulse rounded bg-gray-100" role="status" aria-label="Loading pagination" />}>
          <CustomerPagination query={query} />
        </Suspense>
      </div>
    </div>
  );
}

async function CustomerPagination({ query }: { query: string }) {
  const totalPages = await fetchCustomersPages(query);
  return totalPages > 0 ? <Pagination totalPages={totalPages} /> : null;
}
