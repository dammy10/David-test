"use client";

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="flex min-h-64 flex-col items-center justify-center text-center">
      <h2 className="text-xl font-semibold">Something went wrong loading customers.</h2>
      <p className="mt-2 text-sm text-gray-600">Please try again. If the problem continues, check the database connection.</p>
      <button onClick={() => reset()} className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">Try again</button>
    </main>
  );
}
