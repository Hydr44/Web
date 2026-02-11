"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const items = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = seg.replaceAll("-", " ");
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  if (items.length <= 1) return null;

  return (
    <nav className="text-sm text-slate-400" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        <li>
          <Link className="hover:underline" href="/dashboard">Dashboard</Link>
        </li>
        {items.slice(1).map((item) => (
          <li key={item.href} className="flex items-center gap-2">
            <span className="text-slate-600">/</span>
            {item.isLast ? (
              <span aria-current="page" className="font-medium text-slate-200">
                {item.label}
              </span>
            ) : (
              <Link className="hover:underline" href={item.href}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}


