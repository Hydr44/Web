"use client";
export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold">Si è verificato un errore</h1>
      <p className="mt-2 text-sm text-red-600">{error.message}</p>
    </div>
  );
}
