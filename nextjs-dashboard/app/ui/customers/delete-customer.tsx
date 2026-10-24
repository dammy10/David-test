"use client";

import { TrashIcon } from '@heroicons/react/24/outline';
import { useActionState } from 'react';
import { deleteCustomer } from '@/app/lib/actions';

export default function DeleteCustomer({ id, query = '' }: { id: string; query?: string }) {
  const action = deleteCustomer.bind(null, id, query);
  const [state, formAction, isPending] = useActionState(action, { message: null as string | null });
  return (
    <div>
      <form action={formAction} onSubmit={(event) => {
        if (!window.confirm('Delete this customer? Customers with invoices cannot be deleted.')) event.preventDefault();
      }}>
        <button type="submit" disabled={isPending} className="rounded-md border p-2 hover:bg-gray-100 disabled:opacity-50" aria-label="Delete customer">
          <TrashIcon className="w-5" />
        </button>
      </form>
      {state.message && <p className="mt-2 max-w-64 text-xs text-red-600" role="alert">{state.message}</p>}
    </div>
  );
}
