export type SvgAttributes = Record<string, string | number>;

function attribute(value: string | number): string {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function svgNode(tag: string, attrs: SvgAttributes, content?: string): string {
  const serialized = Object.entries(attrs)
    .map(([name, value]) => `${name}="${attribute(value)}"`)
    .join(" ");
  const open = `<${tag}${serialized ? ` ${serialized}` : ""}`;
  return content === undefined ? `${open}/>` : `${open}>${content}</${tag}>`;
}

export function svgPath(d: string, attrs: SvgAttributes = {}): string {
  return svgNode("path", { d, ...attrs });
}

export function svgGroup(attrs: SvgAttributes, content: string): string {
  return svgNode("g", attrs, content);
}
