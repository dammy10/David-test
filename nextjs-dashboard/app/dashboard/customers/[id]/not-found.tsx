import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-64 flex-col items-center justify-center text-center">
      <h2 className="text-xl font-semibold">Customer not found</h2>
      <p className="mt-2 text-sm text-gray-600">This customer may have been deleted or the link may be invalid.</p>
      <Link href="/dashboard/customers" className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">Back to customers</Link>
    </main>
  );
}
