import { Link, useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { breadcrumbsFor } from "@/lib/breadcrumbs";
export default function Breadcrumbs() {
  const [location] = useLocation();
  const items = breadcrumbsFor(location);
  if (!items.length) return null;
  return (
    <nav className="consumer-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
