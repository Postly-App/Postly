import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 48 }}>404</h1>
        <p>This page does not exist.</p>
        <Link href="/">Go home</Link>
      </div>
    </div>
  );
}
