import { parseRich, type Span } from "@/lib/rich";

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((s, i) => (s.bold ? <strong key={i}>{s.text}</strong> : <span key={i}>{s.text}</span>))}
    </>
  );
}

export function Rich({ text, className }: { text: string; className?: string }) {
  if (!text.trim()) return null;
  return (
    <div className={className ? `rich ${className}` : "rich"}>
      {parseRich(text).map((b, i) =>
        b.kind === "p" ? (
          <p key={i}>
            <Spans spans={b.spans} />
          </p>
        ) : (
          <ul key={i}>
            {b.items.map((it, j) => (
              <li key={j}>
                <Spans spans={it} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
