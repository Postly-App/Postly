import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: number;
  showSlogan?: boolean;
  href?: string;
  style?: React.CSSProperties;
}

export default function Logo({ size = 32, showSlogan = false, href = "/", style }: LogoProps) {
  const content = (
    <span style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", ...style }}>
      <Image
        src="/images/postly_icon.png"
        alt="Postly logo"
        width={size}
        height={size}
        style={{ borderRadius: 8, flexShrink: 0 }}
        priority
      />
      <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{
          fontWeight: 800, fontSize: `${size * 0.5625}px`,
          letterSpacing: "-0.3px", color: "inherit", lineHeight: 1,
        }}>Postly</span>
        {showSlogan && (
          <span style={{
            fontSize: `${size * 0.28}px`, color: "var(--clr-muted)",
            fontWeight: 500, letterSpacing: "0.2px", lineHeight: 1,
          }}>Post everywhere. Grow everywhere.</span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    );
  }

  return content;
}
