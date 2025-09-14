import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <Link
        to={"/" as any}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Return Home
      </Link>
    </div>
  );
}
