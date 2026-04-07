// src/pages/profile.tsx
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileRedirect() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    const uname = (user as any)?.username;
    if (uname) {
      const to = `/profile/${encodeURIComponent(uname)}`;
      // if we’re already there, do nothing
      if (location !== to) navigate(to, { replace: true });
    } else {
      const next = encodeURIComponent("/profile");
      const to = `/auth?next=${next}`;
      if (location !== to) navigate(to, { replace: true });
    }
  }, [user, isLoading, location, navigate]);

  return null;
}
