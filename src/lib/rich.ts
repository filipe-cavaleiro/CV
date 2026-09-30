/**
 * Mini-formato de texto usado nas descrições:
 *  - linhas começadas por "- " formam listas
 *  - linhas em branco separam parágrafos
 *  - **negrito**
 */
export type Span = { text: string; bold: boolean };
export type Block = { kind: "p"; spans: Span[] } | { kind: "ul"; items: Span[][] };

export function spans(line: string): Span[] {
  return line
    .split("**")
    .map((text, i) => ({ text, bold: i % 2 === 1 }))
    .filter((s) => s.text.length > 0);
}

export function parseRich(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: Span[][] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ kind: "p", spans: spans(para.join(" ")) });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ kind: "ul", items: list });
    list = [];
  };

  for (const raw of src.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    const bullet = /^[-•●*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      list.push(spans(bullet[1]));
    } else if (!line) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}
