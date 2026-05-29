// Accessible tooltip primitive. Shows the label on hover OR keyboard focus and exposes
// it to assistive tech via role="tooltip" + aria-describedby. Use this when the tooltip
// carries information the player actually needs (cost previews, mechanic hints) — for
// purely decorative labels a native `title` is fine and lighter-weight.

import { useId, useState, type ReactNode } from "react";

export function Tooltip({
  label,
  children,
  position = "top",
}: {
  label: string;
  children: ReactNode;
  position?: "top" | "bottom";
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className="tip-anchor"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={id}>{children}</span>
      <span
        role="tooltip"
        id={id}
        className={`tip-bubble tip-${position} ${open ? "tip-open" : ""}`.trim()}
      >
        {label}
      </span>
    </span>
  );
}
