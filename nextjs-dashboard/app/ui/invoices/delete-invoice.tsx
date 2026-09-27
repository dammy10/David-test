"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useActionState } from "react";
import { deleteInvoice, type State } from "@/app/lib/actions";

export default function DeleteInvoice({ id }: { id: string }) {
  const deleteInvoiceWithId = deleteInvoice.bind(null, id);
  const [state, formAction, isPending] = useActionState<State, FormData>(
    deleteInvoiceWithId,
    { message: null },
  );

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          className="rounded-md border p-2 hover:bg-gray-100 disabled:opacity-50"
          disabled={isPending}
          aria-label="Delete invoice"
        >
          <TrashIcon className="w-5" />
        </button>
      </form>
      {state.message && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}
