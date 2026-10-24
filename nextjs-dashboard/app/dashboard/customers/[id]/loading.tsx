export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-48 rounded bg-gray-100" />
      <div className="rounded-xl bg-gray-50 p-6"><div className="flex items-center gap-4"><div className="h-[72px] w-[72px] rounded-full bg-gray-200" /><div><div className="h-6 w-40 rounded bg-gray-200" /><div className="mt-3 h-4 w-52 rounded bg-gray-200" /></div></div></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 rounded-xl bg-gray-100" />)}</div>
      <div className="mt-8 h-6 w-40 rounded bg-gray-100" />
      <div className="mt-4 h-56 rounded-lg bg-gray-100" />
    </div>
  );
}
