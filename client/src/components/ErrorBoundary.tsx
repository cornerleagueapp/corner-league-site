// src/components/ErrorBoundary.tsx
import React from "react";

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Make sure we SEE the error
    console.error("[ErrorBoundary] caught", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#0b0f18",
            color: "white",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 600 }}>
            <h1 style={{ fontSize: 20, marginBottom: 8 }}>
              Something went wrong.
            </h1>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.1)",
                padding: 12,
                borderRadius: 8,
              }}
            >
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
