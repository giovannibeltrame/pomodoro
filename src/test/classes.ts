export function classes(el: Element): string[] {
  return (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}
