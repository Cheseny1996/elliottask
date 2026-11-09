import Image from "next/image";
import type { ElementType, ReactNode } from "react";

function isSafeUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

function renderInlineLinks(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const [, label, href] = match;
    nodes.push(isSafeUrl(href)
      ? <a key={`${keyPrefix}-${index}`} href={href} target={href.startsWith("/") ? undefined : "_blank"} rel={href.startsWith("/") ? undefined : "noreferrer noopener"}>{label}</a>
      : label);
    cursor = match.index + match[0].length;
    index += 1;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function ArticleContent({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const content: ReactNode[] = [];

  blocks.forEach((block, index) => {
    const heading = block.match(/^(#{1,6})\s+(.+)$/);
    const image = block.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    const lines = block.split("\n");

    if (heading) {
      const Tag: ElementType = (["h1", "h2", "h3", "h4", "h5", "h6"] as const)[heading[1].length - 1];
      content.push(<Tag key={index}>{heading[2]}</Tag>);
    } else if (image && isSafeUrl(image[2])) {
      content.push(<Image key={index} src={image[2]} alt={image[1]} width={1200} height={800} unoptimized />);
    } else if (lines.every((line) => /^[-*]\s+/.test(line))) {
      content.push(<ul key={index}>{lines.map((line, lineIndex) => <li key={`${index}-${lineIndex}`}>{renderInlineLinks(line.slice(2), `${index}-${lineIndex}`)}</li>)}</ul>);
    } else if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      content.push(<ol key={index}>{lines.map((line, lineIndex) => <li key={`${index}-${lineIndex}`}>{renderInlineLinks(line.replace(/^\d+\.\s+/, ""), `${index}-${lineIndex}`)}</li>)}</ol>);
    } else if (lines.every((line) => line.startsWith("> "))) {
      content.push(<blockquote key={index}>{lines.map((line) => line.slice(2)).join(" ")}</blockquote>);
    } else {
      content.push(<p key={index}>{renderInlineLinks(block.replace(/\n/g, " "), String(index))}</p>);
    }
  });

  return <div className="article-content">{content}</div>;
}
