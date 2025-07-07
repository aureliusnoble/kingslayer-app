export default function Loading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-neutral-light border-t-neutral-dark rounded-full animate-spin" />
      <p className="mt-4 text-neutral-medium">{message}</p>
    </div>
  );
}