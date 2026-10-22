import { useState } from "react";

/** Decorative beside the visible username; initials cover missing and failed photos. */
export default function AccountAvatar({ picture, username, className = "" }: {
  picture?: string | null;
  username: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const source = picture?.trim() || "";
  const safe = /^https:\/\//i.test(source) || /^\/(?!\/)/.test(source);
  const initials = (username.trim().slice(0, 2) || "CL").toUpperCase();
  return (
    <span className={`consumer-account-avatar ${className}`} aria-hidden="true">
      {safe && failed !== source ? (
        <img src={source} alt="" referrerPolicy="no-referrer" onError={() => setFailed(source)} />
      ) : initials}
    </span>
  );
}
