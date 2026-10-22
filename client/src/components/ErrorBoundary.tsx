import React from "react";
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] caught", error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <section
        role="alert"
        className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-start justify-center gap-4 px-6 py-12"
      >
        <h1 className="text-2xl font-semibold">This page couldn’t load</h1>
        <p className="text-muted-foreground">
          Please reload the page. If it keeps happening, contact Corner League
          support and tell us which page you were opening.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
          <a className="rounded-md border px-4 py-2" href="/">
            Go to home
          </a>
          <a className="rounded-md border px-4 py-2" href="/contact">
            Contact support
          </a>
        </div>
      </section>
    );
  }
}
