// A titled panel <section>. Its <h2 class="panel-title"> doubles as the drag handle in the
// Sect dashboard grid.

import type { ReactNode } from "react";

export function Panel({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className={`panel ${className}`.trim()}>
      <h2 className="panel-title">{title}</h2>
      <div className="panel-body">{children}</div>
    </section>
  );
}
