export default function Loading() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-64 rounded bg-gray-200" />
        <div className="h-4 w-96 rounded bg-gray-200" />
        <div className="h-32 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}
