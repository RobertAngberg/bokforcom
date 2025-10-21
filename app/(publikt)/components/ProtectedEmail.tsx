"use client";

import { useEffect, useState } from "react";

type ProtectedEmailProps = {
  encoded: string;
  fallbackText?: string;
  className?: string;
};

export default function ProtectedEmail({ encoded, fallbackText, className }: ProtectedEmailProps) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const binary = atob(encoded);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const decoded = new TextDecoder().decode(bytes);
      setEmail(decoded);
    } catch (error) {
      console.error("Failed to decode email", error);
    }
  }, [encoded]);

  if (!email) {
    if (!fallbackText) {
      return <span className={className} aria-hidden="true" />;
    }

    return (
      <>
        <span className={className} aria-hidden="true">
          {fallbackText}
        </span>
        <noscript>
          <span className={className}>{fallbackText}</span>
        </noscript>
      </>
    );
  }

  return (
    <span className={className} aria-label={email}>
      {email}
    </span>
  );
}
