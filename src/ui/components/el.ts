// Tiny hyperscript helper for building DOM with listeners attached directly.

export interface ElProps {
  class?: string;
  text?: string;
  title?: string;
  value?: string;
  onClick?: (e: MouseEvent) => void;
  onChange?: (e: Event) => void;
  disabled?: boolean;
}

type Child = Node | string | null | undefined | false;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  if (props.class != null) node.className = props.class;
  if (props.text != null) node.textContent = props.text;
  if (props.title != null) node.title = props.title;
  if (props.value != null) (node as HTMLInputElement | HTMLSelectElement).value = props.value;
  if (props.disabled != null) (node as HTMLButtonElement).disabled = props.disabled;
  if (props.onClick) node.addEventListener("click", props.onClick as EventListener);
  if (props.onChange) node.addEventListener("change", props.onChange);

  for (const child of children) {
    if (child == null || child === false) continue;
    node.append(child);
  }
  return node;
}

/** A titled panel <section>. */
export function panel(title: string, body: Child[], className = ""): HTMLElement {
  return el("section", { class: `panel ${className}`.trim() }, [
    el("h2", { class: "panel-title", text: title }),
    el("div", { class: "panel-body" }, body),
  ]);
}
