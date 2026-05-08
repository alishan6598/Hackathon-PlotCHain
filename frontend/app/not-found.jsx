import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="card max-w-lg w-full p-10 text-center">
        <p className="text-amber font-mono text-sm tracking-widest mb-2">
          404
        </p>
        <h2 className="text-3xl font-semibold mb-3">Plot not found</h2>
        <p className="text-muted text-sm mb-6">
          The page you’re looking for doesn’t exist on the chain — or anywhere
          else.
        </p>
        <Link href="/" className="btn-amber inline-block">
          Back to the map
        </Link>
      </div>
    </div>
  );
}
