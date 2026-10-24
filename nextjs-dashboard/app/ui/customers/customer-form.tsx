"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/app/ui/button';
import { createCustomer, updateCustomer, type CustomerActionState } from '@/app/lib/actions';

const avatars = [
  '/customers/amy-burns.png',
  '/customers/balazs-orban.png',
  '/customers/delba-de-oliveira.png',
  '/customers/evil-rabbit.png',
  '/customers/lee-robinson.png',
  '/customers/michael-novotny.png',
];

type CustomerInput = { id: string; name: string; email: string; image_url: string };

export default function CustomerForm({ customer }: { customer?: CustomerInput }) {
  const action = customer ? updateCustomer.bind(null, customer.id) : createCustomer;
  const initialState: CustomerActionState = { message: null, errors: {}, values: {
    name: customer?.name ?? '',
    email: customer?.email ?? '',
    image_url: customer?.image_url ?? avatars[0],
  }};
  const [state, formAction, isPending] = useActionState(action, initialState);
  const values = state.values ?? initialState.values!;

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">Customer name</label>
          <input id="name" name="name" type="text" maxLength={120} required defaultValue={values.name} placeholder="Enter full name" className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500" aria-describedby="name-error" aria-invalid={Boolean(state.errors?.name?.length)} />
          <div id="name-error" aria-live="polite">{state.errors?.name?.map((error) => <p key={error} className="mt-2 text-sm text-red-500">{error}</p>)}</div>
        </div>
        <div className="mb-6">
          <label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label>
          <input id="email" name="email" type="email" maxLength={254} required defaultValue={values.email} placeholder="name@example.com" className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500" aria-describedby="email-error" aria-invalid={Boolean(state.errors?.email?.length)} />
          <div id="email-error" aria-live="polite">{state.errors?.email?.map((error) => <p key={error} className="mt-2 text-sm text-red-500">{error}</p>)}</div>
        </div>
        <fieldset>
          <legend className="mb-3 block text-sm font-medium">Choose an avatar</legend>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {avatars.map((avatar) => (
              <label key={avatar} className="flex cursor-pointer flex-col items-center gap-2 rounded-md border bg-white p-3 has-[:checked]:border-blue-600 has-[:checked]:ring-2 has-[:checked]:ring-blue-200">
                <input type="radio" name="image_url" value={avatar} defaultChecked={values.image_url === avatar} className="h-4 w-4" aria-label={`Select ${avatar.split('/').pop()?.replace('.png', '').replaceAll('-', ' ')} avatar`} />
                <Image src={avatar} alt="" width={48} height={48} className="rounded-full" />
              </label>
            ))}
          </div>
          <div id="image_url-error" aria-live="polite">{state.errors?.image_url?.map((error) => <p key={error} className="mt-2 text-sm text-red-500">{error}</p>)}</div>
        </fieldset>
      </div>
      <div aria-live="polite" aria-atomic="true">{state.message && <p className="mt-3 text-sm text-red-600" role="alert">{state.message}</p>}</div>
      <div className="mt-6 flex justify-end gap-4">
        <Link href="/dashboard/customers" className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 hover:bg-gray-200">Cancel</Link>
        <Button type="submit" disabled={isPending}>{isPending ? 'Saving…' : customer ? 'Update Customer' : 'Create Customer'}</Button>
      </div>
    </form>
  );
}
