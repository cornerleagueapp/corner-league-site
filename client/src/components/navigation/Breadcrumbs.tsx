import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbsFor, type Breadcrumb } from "@/lib/breadcrumbs";
export default function Breadcrumbs() {
  const [location] = useLocation();
  const items = breadcrumbsFor(location);
  return <BreadcrumbTrail items={items} />;
}
export function BreadcrumbTrail({ items }: { items: Breadcrumb[] }) {
  if (!items.length) return null;
  return (
    <nav className="consumer-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            {index > 0 && <ChevronRight size={12} aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href}>
                {index === 0 && <Home size={14} aria-hidden="true" />}
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
