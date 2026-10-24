import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function CreateCustomer() {
  return <Link href="/dashboard/customers/create" className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"><span className="hidden md:block">Create Customer</span><PlusIcon className="h-5 md:ml-4" /></Link>;
}

export function UpdateCustomer({ id }: { id: string }) {
  return <Link href={`/dashboard/customers/${id}/edit`} className="rounded-md border p-2 hover:bg-gray-100" aria-label="Edit customer"><PencilIcon className="w-5" /></Link>;
}
