"use client";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Please try again.</p>
        <button onClick={reset} style={{ marginTop: 16, padding: "8px 16px" }}>
          Try again
        </button>
      </div>
    </div>
  );
}
