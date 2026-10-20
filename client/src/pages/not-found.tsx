import { Link } from "wouter";
export default function NotFound() {
  return (
    <main className="cl-not-found">
      <span className="cl-error-code">404</span>
      <h1>Page not found</h1>
      <p>This page may have moved, or the link may be out of date.</p>
      <div>
        <Link href="/">Back to home</Link>
        <Link href="/racer">Browse athletes</Link>
      </div>
    </main>
  );
}
